const express = require("express");
const messageController = require("../controllers/messageController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

router.get("/", messageController.getDMList);
router.post(
  "/",
  authController.restrictFreeUser,
  messageController.sendMessage
);

router.get("/:userId", messageController.getConversation);

router.patch("/read/:messageId", messageController.markAsRead);

router.delete(
  "/unsend/:messageId",
  authController.restrictFreeUser,
  messageController.unsendMessage
);

router.delete(
  "/conversation/:userId",
  authController.restrictFreeUser,
  messageController.deleteConversation
);

module.exports = router;
