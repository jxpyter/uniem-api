const express = require("express");
const userController = require("./../controllers/userController");
const authController = require("./../controllers/authController");
const reportController = require("../controllers/reportController");
const { logAction } = require("../controllers/logController");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

router.get("/me", authController.protect, userController.myProfile);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);

router.patch(
  "/restore-account",
  authController.protect,
  userController.restoreAccount
);

router.route("/:id").get(authController.protect, userController.getUserProfile);
router.delete("/:id/deleteMe", authController.protect, userController.deleteMe);
router.patch(
  "/:id/updateMe",
  authController.protect,
  userController.updateMe,
  logAction
);

// 🌟 Kullanıcılara Teşekkür Etme (Puan Sistemi)
router.patch(
  "/:id/thanks",
  authController.protect,
  authController.restrictFreeUser,
  userController.thanks,
  logAction
);
// 📌 Takip İşlemleri (Sosyal Sistem)
router.post(
  "/:id/follow",
  authController.protect,
  authController.restrictFreeUser,
  userController.followUser,
  logAction
);

router.post(
  "/:id/acceptFollowRequest",
  authController.protect,
  authController.restrictFreeUser,
  userController.acceptFollowRequest
);
router.post(
  "/:id/rejectFollowRequest",
  authController.protect,
  authController.restrictFreeUser,
  userController.rejectFollowRequest
);
router.post(
  "/:id/unfollow",
  authController.protect,
  authController.restrictFreeUser,
  userController.unfollowUser,
  logAction
);

// 🚨 Raporlama Sistemi
router.post(
  "/report",
  authController.protect,
  reportController.reportItem,
  logAction
);

module.exports = router;
