const User = require("../models/userModel");
const AppError = require("../utils/appError");

exports.getUserProfile = async (id, currentUserId, userRole) => {
  try {
    // 🔥 **Admin her zaman her şeye erişebilir**
    if (userRole === "admin") {
      const user = await User.findById(id);
      if (!user) {
        return {
          success: false,
          error: "Kullanıcı bulunamadı!",
          statusCode: 404,
        };
      }
      return { success: true, data: user, statusCode: 200 };
    }

    const user = await User.findById(id)
      .populate("followers", "name")
      .populate("following", "name")
      .populate("followRequests", "name");

    if (!user) {
      return {
        success: false,
        error: "Kullanıcı bulunamadı!",
        statusCode: 404,
      };
    }

    // ✅ **Kendi profilini görüntülüyorsa, tüm bilgileri görebilir**
    if (id === currentUserId) {
      return {
        success: true,
        data: {
          name: user.name,
          points: user.points,
          rank: user.rank,
          thanks: user.thanks,
          badges: user.badges,
          followers: user.followers,
          following: user.following,
          followRequests: user.followRequests,
        },
        statusCode: 200,
      };
    }

    // ✅ **Profil public ise herkes görebilir**
    if (user.isPublic) {
      return {
        success: true,
        data: {
          name: user.name,
          points: user.points,
          rank: user.rank,
          thanks: user.thanks,
          badges: user.badges,
          followers: user.followers.length,
          following: user.following.length,
        },
        statusCode: 200,
      };
    }

    // ✅ **Profil private ise sadece takipçiler görebilir**
    if (
      !user.isPublic &&
      user.followers.some((f) => f._id.toString() === currentUserId)
    ) {
      return {
        success: true,
        data: {
          name: user.name,
          points: user.points,
          rank: user.rank,
          thanks: user.thanks,
          badges: user.badges,
          followers: user.followers.length,
          following: user.following.length,
        },
        statusCode: 200,
      };
    }

    return {
      success: false,
      error: "Bu profil sadece takipçilerine açık!",
      statusCode: 403,
    };
  } catch (error) {
    return { success: false, error: "Sunucu hatası!", statusCode: 500 };
  }
};
exports.updateMe = async (userId, updateData) => {
  // Kullanıcıyı ID ile bulalım
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new AppError("No user found with that ID", 404);
  }

  // Güncellenmesi gereken alanları işleyelim
  const allowedFields = ["name", "password", "phone", "profilePhoto"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  });

  // Eğer güncellenebilecek bir alan yoksa hata fırlat
  if (Object.keys(updates).length === 0) {
    throw new AppError("Güncellenecek veri yok!", 400);
  }

  // Kullanıcıyı güncelleme işlemi
  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  return updatedUser;
};
exports.deleteMe = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true }
  );

  if (!user) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  return user;
};
exports.restoreAccount = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  if (user.isActive) {
    throw new AppError("Hesabınız zaten aktif!", 400);
  }

  user.isActive = true;
  user.deactivationDate = null;
  await user.save({ validateBeforeSave: false });

  return user;
};
exports.sendThanks = async (senderId, receiverId) => {
  const user = await User.findById(receiverId);
  if (senderId === receiverId) {
    throw new AppError("Kendinize teşekkür edemezsiniz!", 400);
  }

  if (!user) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  if (user.thankedBy.includes(senderId)) {
    throw new AppError("Bu kullanıcıya zaten teşekkür ettiniz!", 400);
  }

  user.thanks += 1;
  user.thankedBy.push(senderId);

  await user.save({ validateBeforeSave: false });

  return user.thanks;
};
exports.followUser = async (currentUserId, targetUserId) => {
  const userToFollow = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (currentUserId === targetUserId) {
    throw new AppError("Kendinizi takip edemezsiniz!", 400);
  }

  if (!userToFollow || !currentUser) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  if (currentUser.following.includes(targetUserId)) {
    throw new AppError("Bu kullanıcıyı zaten takip ediyorsunuz!", 400);
  }

  if (userToFollow.isPublic) {
    currentUser.following.push(targetUserId);
    userToFollow.followers.push(currentUserId);
  } else {
    if (!userToFollow.followRequests.includes(currentUserId)) {
      userToFollow.followRequests.push(currentUserId);
    }
  }

  await currentUser.save({ validateBeforeSave: false });
  await userToFollow.save({ validateBeforeSave: false });

  return userToFollow.isPublic
    ? "Kullanıcı başarıyla takip edildi!"
    : "Takip isteği gönderildi!";
};
exports.unfollowUser = async (currentUserId, targetUserId) => {
  const userToUnfollow = await User.findById(targetUserId);
  const currentUser = await User.findById(currentUserId);

  if (!userToUnfollow || !currentUser) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  if (!currentUser.following.includes(targetUserId)) {
    throw new AppError("Bu kullanıcıyı zaten takip etmiyorsunuz!", 400);
  }

  currentUser.following = currentUser.following.filter(
    (id) => id.toString() !== targetUserId
  );
  userToUnfollow.followers = userToUnfollow.followers.filter(
    (id) => id.toString() !== currentUserId
  );

  await currentUser.save({ validateBeforeSave: false });
  await userToUnfollow.save({ validateBeforeSave: false });

  return "Kullanıcı takipten çıkarıldı!";
};
exports.acceptFollowRequest = async (currentUserId, requesterId) => {
  const currentUser = await User.findById(currentUserId);
  const requester = await User.findById(requesterId);

  if (!currentUser || !requester) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  if (!currentUser.followRequests.includes(requesterId)) {
    throw new AppError("Gelen takip isteği yok!", 400);
  }

  // ✅ Takip isteğini kabul et
  currentUser.followers.push(requesterId);
  requester.following.push(currentUserId);

  // ✅ Takip istek listesinden kaldır
  currentUser.followRequests = currentUser.followRequests.filter(
    (id) => id.toString() !== requesterId
  );

  await currentUser.save({ validateBeforeSave: false });
  await requester.save({ validateBeforeSave: false });

  return "Takip isteği kabul edildi!";
};
exports.rejectFollowRequest = async (currentUserId, requesterId) => {
  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  if (!currentUser.followRequests.includes(requesterId)) {
    throw new AppError("Gelen takip isteği yok!", 400);
  }

  // ✅ Takip isteğini reddet
  currentUser.followRequests = currentUser.followRequests.filter(
    (id) => id.toString() !== requesterId
  );

  await currentUser.save({ validateBeforeSave: false });

  return "Takip isteği reddedildi!";
};
