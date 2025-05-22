const messageService = require("../services/messageService");
const catchAsync = require("../utils/catchAsync");

exports.sendMessage = catchAsync(async (req, res, next) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  const message = await messageService.sendMessage(
    senderId,
    receiverId,
    content
  );
  res.status(201).json(message);
});

exports.getDMList = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const dmList = await messageService.getDMList(userId);
  res.status(200).json(dmList);
});

exports.getConversation = catchAsync(async (req, res, next) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  const messages = await messageService.getConversation(
    currentUserId,
    otherUserId
  );
  res.status(200).json(messages);
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const messageId = req.params.messageId;

  const message = await messageService.markAsRead(messageId, userId);
  res.status(200).json(message);
});

exports.unsendMessage = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const messageId = req.params.messageId;

  const response = await messageService.unsendMessage(userId, messageId);
  res.status(200).json(response);
});

exports.deleteConversation = catchAsync(async (req, res, next) => {
  const currentUserId = req.user.id;
  const otherUserId = req.params.userId;

  const response = await messageService.deleteConversation(
    currentUserId,
    otherUserId
  );
  res.status(200).json(response);
});
