const catchAsync = require("../utils/catchAsync");
const notificationService = require("../services/notificationService");

// ✅ Kullanıcının Bildirimlerini Getir
exports.getNotifications = catchAsync(async (req, res) => {
  const notifications = await notificationService.getUserNotifications(
    req.user.id
  );
  res.status(200).json({ status: "success", data: notifications });
});

// ✅ Bildirimleri Okundu Olarak İşaretle
exports.markAsRead = catchAsync(async (req, res) => {
  await notificationService.markNotificationsAsRead(req.user.id);
  res
    .status(200)
    .json({
      status: "success",
      message: "Bildirimler okundu olarak işaretlendi.",
    });
});

// ✅ Okunmamış Bildirim Sayısını Getir
exports.getUnreadCount = catchAsync(async (req, res) => {
  const unreadCount = await notificationService.getUnreadCount(req.user.id);
  res.status(200).json({ status: "success", unreadCount });
});
