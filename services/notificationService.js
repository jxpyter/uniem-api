const Notification = require("../models/notificationModel");

// ✅ Yeni Bildirim Oluştur
exports.createNotification = async (receiver, sender, type, message) => {
  return await Notification.create({ receiver, sender, type, message });
};

// ✅ Kullanıcının Bildirimlerini Getir
exports.getUserNotifications = async (userId) => {
  return await Notification.find({ receiver: userId })
    .sort("-createdAt")
    .limit(50);
};

// ✅ Bildirimleri Okundu Olarak İşaretle
exports.markNotificationsAsRead = async (userId) => {
  await Notification.updateMany(
    { receiver: userId, isRead: false },
    { isRead: true }
  );
};

// ✅ Okunmamış Bildirim Sayısını Getir
exports.getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ receiver: userId, isRead: false });
};
