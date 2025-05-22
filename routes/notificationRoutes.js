const express = require("express");
const notificationController = require("../controllers/notificationController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect); // 🔐 Yetkilendirme zorunlu

router.get("/", notificationController.getNotifications); // 📩 Bildirimleri getir
router.patch("/read", notificationController.markAsRead); // ✅ Okundu olarak işaretle
router.get("/unread-count", notificationController.getUnreadCount); // 🔢 Okunmamış bildirim sayısı

module.exports = router;
