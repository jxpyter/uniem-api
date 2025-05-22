const express = require("express");
const taskController = require("../controllers/taskController");
const authController = require("../controllers/authController");

const router = express.Router();

// 📌 Tüm Görevleri Getir (Sadece yetkisi olanlar görebilir)
router.get("/", authController.protect, taskController.getAllTasks);

// 📌 Kullanıcının Görev İlerlemesini Görüntüleme
router.get(
  "/user-progress/:userId",
  authController.protect,
  taskController.getUserTaskProgress
);

module.exports = router;
