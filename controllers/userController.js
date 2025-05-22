const User = require("../models/userModel");
const userService = require("../services/userService");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const taskController = require("./taskController");
const calculateRank = require("../utils/calculateRank");

exports.getUserProfile = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const userRole = req.user.role;

  const { success, data, statusCode, error } = await userService.getUserProfile(
    id,
    currentUserId,
    userRole
  );

  if (!success) {
    return next(new AppError(error, statusCode));
  }

  return res.status(statusCode).json({ success: true, data });
});
exports.myProfile = catchAsync(async (req, res, _next) => {
  const user = await User.findById(req.user.id).select("-password"); // Şifre hariç tüm bilgileri getir
  if (!user) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});
exports.updateMe = catchAsync(async (req, res, next) => {
  // Kullanıcı ID'sini parametre olarak alıyoruz
  const userId = req.params.id;

  // Güncellenmesi gereken veriyi almak
  const updates = req.body; // req.body'den güncellenen alanları alıyoruz

  // Service katmanına, güncelleme işlemi için çağrı yapıyoruz
  const updatedUser = await userService.updateMe(userId, updates);

  // Güncelleme başarılıysa, yanıt gönderiyoruz
  if (!updatedUser) {
    return next(new AppError("Kullanıcı güncellenemedi!", 400));
  }

  res.status(200).json({
    success: true,
    data: { user: updatedUser },
  });
});
exports.deleteMe = catchAsync(async (req, res, next) => {
  await userService.deleteMe(req.user.id);

  res.status(204).json({
    status: "success",
    message:
      "Hesabınızı başarıyla devre dışı bıraktınız. 30 gün içerisinde giriş yapmazsanız hesabınız kalıcı olarak silinecek.",
    data: null,
  });
});
exports.restoreAccount = catchAsync(async (req, res, next) => {
  await userService.restoreAccount(req.user.id);

  res.status(200).json({
    status: "success",
    message: "Hesabınız başarıyla geri açıldı!",
  });
});
exports.thanks = catchAsync(async (req, res, next) => {
  const { id: receiverId } = req.params;
  const senderId = req.user.id;

  const thanksCount = await userService.sendThanks(senderId, receiverId);

  // Görev tamamlama işlemi (opsiyonel)
  taskController.completeTask({ userId: senderId, taskType: "USER" });

  res.status(200).json({
    success: true,
    message: "Teşekkür başarıyla gönderildi!",
    thanks: thanksCount,
  });
});
exports.followUser = catchAsync(async (req, res, next) => {
  const { id: targetUserId } = req.params;
  const currentUserId = req.user.id;

  const message = await userService.followUser(currentUserId, targetUserId);

  taskController.completeTask({
    userId: req.user.id,
    taskType: "USER",
  });

  res.status(200).json({
    success: true,
    message,
  });
});
exports.unfollowUser = catchAsync(async (req, res, next) => {
  const { id: targetUserId } = req.params;
  const currentUserId = req.user.id;

  const message = await userService.unfollowUser(currentUserId, targetUserId);

  res.status(200).json({
    success: true,
    message,
  });
});
exports.acceptFollowRequest = catchAsync(async (req, res, next) => {
  const { id: requesterId } = req.params;
  const currentUserId = req.user.id;

  const message = await userService.acceptFollowRequest(
    currentUserId,
    requesterId
  );

  res.status(200).json({
    success: true,
    message,
  });
});
exports.rejectFollowRequest = catchAsync(async (req, res, next) => {
  const { id: requesterId } = req.params;
  const currentUserId = req.user.id;

  const message = await userService.rejectFollowRequest(
    currentUserId,
    requesterId
  );

  res.status(200).json({
    success: true,
    message,
  });
});
exports.updateUserPoints = catchAsync(async (userId, pointsToAdd) => {
  const user = await User.findById(userId);
  if (!user) return next(new AppError("Kullanıcı bulunamadı!", 404));

  user.points = Math.max(0, user.points + pointsToAdd); // **Puan ekleme**
  user.rank = calculateRank(user.points); // **Yeni rütbeyi hesapla**

  await user.save({ validateBeforeSave: false });

  console.log(
    `✅ Kullanıcı Puanı Güncellendi: ${user.points}, Yeni Seviye: ${user.rank}`
  );
});
