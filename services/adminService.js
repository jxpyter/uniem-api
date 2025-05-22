const User = require("../models/userModel");
const Note = require("../models/noteModel");
const Task = require("../models/taskModel");
const Blog = require("../models/blogModel");
const Report = require("../models/reportModel");
const CommunityItem = require("../models/communityModel");
const AppError = require("../utils/appError");

const ROLE_HIERARCHY = {
  admin: 3, // **En yüksek yetki**
  manager: 2, // **Moderator ve User yönetebilir**
  moderator: 1, // **Sadece User yönetebilir**
  user: 0, // **Hiçbir yetkisi yok**
};

exports.getDashboardStats = async () => {
  // 📌 Kullanıcı İstatistikleri
  const activeUsers = await User.countDocuments({ isActive: true });
  const suspendedUsers = await User.countDocuments({ isSuspended: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });

  // 📌 Görev İstatistikleri
  const totalTasks = await Task.countDocuments();

  // 📌 Blog İstatistikleri
  const totalBlogs = await Blog.countDocuments();

  // 📌 Not İstatistikleri
  const totalNotes = await Note.countDocuments();

  // 📌 Community İçerikleri (Post, Event, Giveaway, Competition, Announcement)
  const communityStats = await CommunityItem.aggregate([
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  // 📌 Topluluk içeriğini nesne olarak formatlayalım
  const communityItems = {
    post: 0,
    event: 0,
    giveaway: 0,
    competition: 0,
    announcement: 0,
  };

  communityStats.forEach((item) => {
    if (communityItems.hasOwnProperty(item._id)) {
      communityItems[item._id] = item.count;
    }
  });

  return {
    users: { activeUsers, suspendedUsers, inactiveUsers },
    tasks: { totalTasks },
    blogs: { totalBlogs },
    notes: { totalNotes },
    community: communityItems,
  };
};

// ✅ 1. KULLANICI YÖNETİMİ (User Management)
exports.getAllUsers = async () => {
  // Veritabanından kullanıcıları çekiyoruz
  const users = await User.find();
  return { users, count: users.length }; // Kullanıcılar ve toplam sayıyı döndürüyoruz
};
exports.createUser = async (userData, currentUser) => {
  const { role } = userData;

  // Mevcut Kullanıcının Yetki Seviyesi
  const currentUserRole = ROLE_HIERARCHY[currentUser.role];

  // Oluşturulmak istenen kullanıcının rolü ile mevcut kullanıcının rolünü karşılaştır
  if (ROLE_HIERARCHY[role] >= currentUserRole) {
    throw new AppError(
      "You cannot create a user with a higher role than yours.",
      403
    );
  }

  // Kullanıcıyı oluşturma
  const newUser = await User.create(userData);
  return newUser; // Oluşturulan kullanıcıyı döndürüyoruz
};
exports.updateUser = async (userId, userData, currentUser) => {
  console.log("🔍 Güncelleme işlemi başladı...");
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new AppError("User not found!", 404);
  }
  console.log("🎯 Kullanıcı bulundu mu?", targetUser);

  // Mevcut Kullanıcının Yetki Seviyesi
  console.log("🛡 Yetki seviyesi kontrol ediliyor...");
  const currentUserRole = ROLE_HIERARCHY[currentUser.role];

  // Güncellenmek istenen kullanıcının rolü
  const newRole = userData.role;

  // Eğer yeni rol mevcut kullanıcının rolüne eşit veya daha yüksekse
  if (newRole && ROLE_HIERARCHY[newRole] >= currentUserRole) {
    console.error("🚨 Yetki hatası!");
    throw new AppError(
      "You cannot assign a user the same role or a higher role than yours.",
      403
    ); // Rol kontrolü yapılır
  }

  // Kullanıcıyı güncelle
  console.log("⚙ Kullanıcı güncelleniyor...");
  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { $set: userData },
    { new: true, runValidators: true }
  );

  return updatedUser; // Güncellenmiş kullanıcıyı döndür
};
exports.deleteUser = async (userId, currentUser) => {
  // Silinmek istenen kullanıcıyı bul
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new AppError("User not found!", 404); // Kullanıcı bulunamazsa hata fırlatıyoruz
  }

  // Mevcut Kullanıcının Yetki Seviyesi
  const currentUserRole = ROLE_HIERARCHY[currentUser.role];

  // Silinmek istenen kullanıcının rolü
  if (ROLE_HIERARCHY[targetUser.role] >= currentUserRole) {
    throw new AppError(
      "You cannot delete a user with a higher or equal role.",
      403
    ); // Rol kontrolü yapılır
  }

  // Kullanıcıyı sil
  await User.findByIdAndDelete(userId);
};
exports.viewAllSuspendedUser = async () => {
  // isActive değeri false olan kullanıcıları buluyoruz
  const bannedUsers = await User.find({ isSuspended: true });

  return bannedUsers; // Bulunan kullanıcıları geri döndürüyoruz
};
exports.warnUser = async (userId, warningMessage, currentUser) => {
  // Kullanıcıyı bul
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("Kullanıcı bulunamadı!", 404); // Kullanıcı bulunmazsa hata fırlatıyoruz
  }

  // Kullanıcıya uyarıyı ekle
  user.warnings.push({
    message: warningMessage,
    issuedBy: currentUser.id,
  });

  // Eğer uyarı sayısı 3 veya daha fazla ise, kullanıcıyı askıya al
  if (user.warnings.length >= 3) {
    user.isSuspended = true;
    user.suspensionReason = "3 defa uyarı aldı.";
    user.suspensionEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün askıya alma
  }

  // Kullanıcıyı güncelle
  await user.save({ validateBeforeSave: false });
};
exports.getUserWarnings = async (userId) => {
  const user = await User.findById(userId).select("warnings");

  if (!user) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  return user.warnings;
};
exports.suspendUser = async (userId, reason, duration) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  user.isSuspended = true;
  user.isActive = false;
  user.suspensionReason = reason || "Sebep belirtilmedi.";

  if (duration) {
    user.suspensionEndDate = new Date(
      Date.now() + duration * 24 * 60 * 60 * 1000
    ); // **Gün bazlı**
  } else {
    user.suspensionEndDate = null; // **Süresiz**
  }

  await user.save({ validateBeforeSave: false });

  return user; // Güncellenmiş kullanıcıyı döndürüyoruz
};
exports.unsuspendUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("Kullanıcı bulunamadı!", 404);
  }

  if (!user.isSuspended) {
    throw new AppError("Bu kullanıcı zaten aktif!", 400);
  }

  user.isSuspended = false;
  user.isActive = true;
  user.suspensionReason = null;
  user.suspensionEndDate = null;

  await user.save({ validateBeforeSave: false });

  return user; // Güncellenmiş kullanıcıyı döndürüyoruz
};

//
// ✅ 3. NOT YÖNETİMİ (Note Management)
exports.getAllNotes = async () => {
  return await Note.find().populate("author", "name email");
};
exports.getNote = async (noteId) => {
  return await Note.findById(noteId).populate("owner", "name email");
};
exports.updateNote = async (noteId, updateData) => {
  return await Note.findByIdAndUpdate(noteId, updateData, { new: true });
};
exports.deleteNote = async (noteId) => {
  return await Note.findByIdAndDelete(noteId);
};

//
// ✅ 4. GÖREV YÖNETİMİ (Task Management)
exports.getAllTasks = async () => {
  const tasks = await Task.find();
  return tasks;
};
exports.createTask = async (taskData, userId) => {
  // Task'i oluştur
  const newTask = await Task.create({
    ...taskData,
    createdBy: userId, // Hangi kullanıcı tarafından oluşturulduğunu belirtiyoruz
  });

  return newTask;
};
exports.updateTask = async (taskId, taskData) => {
  // Görevi güncelle
  const updatedTask = await Task.findByIdAndUpdate(taskId, taskData, {
    new: true,
    runValidators: true,
  });

  return updatedTask;
};
exports.deleteTask = async (taskId) => {
  // Görevi sil
  const task = await Task.findByIdAndDelete(taskId);

  if (!task) {
    throw new AppError("Task not found.", 404); // Eğer görev bulunmazsa hata fırlatıyoruz
  }
};

//
// ✅ 5. TOPLULUK YÖNETİMİ (Community Management)
exports.getAllCommunityItems = async ({ type, categories, tags }) => {
  let filter = {};

  if (type) filter.type = type;
  if (categories) {
    filter.categories = {
      $in: Array.isArray(categories)
        ? categories
        : categories.split(",").map((c) => c.trim()),
    };
  }
  if (tags) {
    filter.tags = {
      $in: Array.isArray(tags) ? tags : tags.split(",").map((t) => t.trim()),
    };
  }

  return await CommunityItem.find(filter).sort("-createdAt");
};
exports.getCommunityItem = async (id) => {
  const item = await CommunityItem.findById(id);
  if (!item) {
    throw new AppError("Bu ID ile içerik bulunamadı!", 404);
  }
  return item;
};
exports.createCommunityItem = async (data, userId) => {
  const { type, title, content, categories, tags, media, eventDate } = data;

  const newItem = await CommunityItem.create({
    user: userId,
    type,
    title,
    content,
    categories: categories ? categories.split(",").map((c) => c.trim()) : [],
    tags: tags ? tags.split(",").map((t) => t.trim()) : [],
    media,
    eventDate,
  });

  return newItem;
};
exports.updateCommunityItem = async (itemId, updateData) => {
  const item = await CommunityItem.findById(itemId);

  if (!item) {
    throw new AppError("Bu ID ile içerik bulunamadı!", 404);
  }

  // Güncelleme işlemini yap
  item.title = updateData.title || item.title;
  item.content = updateData.content || item.content;
  item.media = updateData.media || item.media;
  item.tags = updateData.tags
    ? updateData.tags.split(",").map((t) => t.trim())
    : item.tags;
  item.category = updateData.category
    ? updateData.category.split(",").map((c) => c.trim())
    : item.category;
  item.eventDate = updateData.eventDate || item.eventDate;

  await item.save();
  return item;
};
exports.deleteCommunityItem = async (itemId) => {
  const item = await CommunityItem.findById(itemId);

  if (!item) {
    throw new AppError("Bu ID ile içerik bulunamadı!", 404);
  }

  // İçeriği sil
  await CommunityItem.findByIdAndDelete(itemId);
};

//
// ✅ 5. BLOG YÖNETİMİ (Blog Management)
exports.getAllBlogs = async () => {
  return await Blog.find().sort("-createdAt");
};
exports.createBlog = async (adminId, blogData) => {
  return await Blog.create({ ...blogData, author: adminId });
};
exports.updateBlog = async (blogId, updateData) => {
  const blog = await Blog.findByIdAndUpdate(blogId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!blog) throw new AppError("Blog bulunamadı!", 404);
  return blog;
};
exports.deleteBlog = async (blogId) => {
  const blog = await Blog.findByIdAndDelete(blogId);
  if (!blog) throw new AppError("Blog bulunamadı!", 404);
};

//
// ✅ 6. RAPOR VE İSTATİSTİKLER
exports.getReports = async () => {
  const reports = await Report.find()
    .populate("reporter", "name email") // Raporlayan kullanıcı
    .populate({
      path: "reportedItem",
      select: "name email title content description", // Raporlanan öğenin bazı detaylarını çek
    });

  return reports;
};
exports.reviewReport = async (id) => {
  const report = await Report.findById(id).populate(
    "reportedUser",
    "name email"
  );

  return report;
};
exports.takeActionOnReport = async (reportId, action) => {
  const report = await Report.findById(reportId);
  if (!report) {
    return { error: "Bu ID ile rapor bulunamadı!" };
  }

  if (action === "delete") {
    if (report.itemType === "User") {
      await User.findByIdAndDelete(report.reportedItem);
    } else if (report.itemType === "CommunityItem") {
      await CommunityItem.findByIdAndDelete(report.reportedItem);
    } else if (report.itemType === "Note") {
      await Note.findByIdAndDelete(report.reportedItem);
    } else if (report.itemType === "Blog") {
      await Blog.findByIdAndDelete(report.reportedItem);
    } else if (report.itemType === "Task") {
      await Task.findByIdAndDelete(report.reportedItem);
    }

    await report.deleteOne();

    return { message: "Raporlanan öğe silindi ve rapor kaldırıldı." };
  }

  if (action === "dismiss") {
    report.status = "reviewed";
    await report.save();

    return { message: "Rapor incelendi ve geçersiz olarak işaretlendi." };
  }

  if (action === "resolve") {
    report.status = "resolved";
    await report.save();

    return { message: "Rapor çözüldü ve kapatıldı." };
  }

  return { error: "Geçersiz işlem!" };
};
exports.getStatistics = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const suspendedUsers = await User.countDocuments({ isSuspended: true });

  const totalCommunityItems = await CommunityItem.countDocuments();
  const totalNotes = await Note.countDocuments();
  const totalTasks = await Task.countDocuments();
  const totalBlogs = await Blog.countDocuments();

  const totalReports = await Report.countDocuments({ status: "pending" });

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
    },
    content: {
      communityItems: totalCommunityItems,
      notes: totalNotes,
      tasks: totalTasks,
      blogs: totalBlogs,
    },
    reports: { pending: totalReports },
  };
};
//tüm community itemlar eklenebilir?1
exports.getPopularCommunityItems = async () => {
  const mostLikedItems = await CommunityItem.find()
    .sort({ likesCount: -1 })
    .limit(10);
  const mostCommentedItems = await CommunityItem.find()
    .sort({ "comments.length": -1 })
    .limit(10);

  return {
    mostLiked: mostLikedItems,
    mostCommented: mostCommentedItems,
  };
};
exports.getSubscriptionStats = async () => {
  return await User.aggregate([
    {
      $group: {
        _id: "$subscription", // Subscription türüne göre gruplama
        count: { $sum: 1 }, // Her gruptan toplam kullanıcı sayısını al
      },
    },
  ]);
};
