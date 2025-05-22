const Message = require("../models/messageModel");
const AppError = require("../utils/appError");

// ✅ Mesaj Gönderme Servisi
exports.sendMessage = async (senderId, receiverId, content) => {
  if (receiverId.toString() === senderId.toString()) {
    throw new AppError("Kendine mesaj gönderemezsin!", 400);
  }

  const message = await Message.create({
    sender: senderId,
    receiver: receiverId,
    content,
  });
  return message;
};

exports.getDMList = async (userId) => {
  const messages = await Message.find({
    $or: [{ sender: userId }, { receiver: userId }],
    deleted_by: { $ne: userId }, // Kendisi konuşmayı silmemiş olacak
  })
    .sort("-createdAt")
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!messages.length) {
    return [];
  }

  // Konuştuğu kullanıcıları belirle
  const dmMap = new Map();

  messages.forEach((msg) => {
    const otherUser =
      msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
    if (!dmMap.has(otherUser._id.toString())) {
      dmMap.set(otherUser._id.toString(), {
        user: otherUser,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        unreadCount: 0,
      });
    }
    if (!msg.is_read && msg.receiver._id.toString() === userId) {
      dmMap.get(otherUser._id.toString()).unreadCount += 1;
    }
  });

  return Array.from(dmMap.values()).sort(
    (a, b) => b.lastMessageAt - a.lastMessageAt
  );
};

exports.getConversation = async (currentUserId, otherUserId) => {
  const messages = await Message.find({
    $or: [
      { sender: currentUserId, receiver: otherUserId },
      { sender: otherUserId, receiver: currentUserId },
    ],
    deleted_by: { $ne: currentUserId }, // Kullanıcı konuşmayı silmemiş olacak
  })
    .sort("createdAt")
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!messages.length) {
    throw new AppError("Bu kullanıcıyla bir konuşma başlat!", 404);
  }

  // Okunmamış mesajları okundu olarak işaretle
  await Message.updateMany(
    { receiver: currentUserId, sender: otherUserId, is_read: false },
    { $set: { is_read: true } }
  );

  return messages;
};

exports.markAsRead = async (messageId, userId) => {
  const message = await Message.findOneAndUpdate(
    { _id: messageId, receiver: userId },
    { is_read: true },
    { new: true }
  );

  if (!message) {
    throw new AppError("Mesaj bulunamadı!", 404);
  }

  return message;
};

// ✅ Kendi gönderdiği mesajı tamamen silme (Unsend)
exports.unsendMessage = async (userId, messageId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new AppError("Mesaj bulunamadı!", 404);
  }

  if (message.sender.toString() !== userId.toString()) {
    throw new AppError("Sadece kendi mesajını silebilirsin!", 403);
  }

  await Message.findByIdAndDelete(messageId);
  return { success: true, message: "Mesaj tamamen silindi (Unsend)." };
};

// ✅ Konuşmayı kendinden silme (Soft Delete)
exports.deleteConversation = async (currentUserId, otherUserId) => {
  await Message.updateMany(
    {
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId },
      ],
    },
    { $push: { deleted_by: currentUserId } }
  );

  return { success: true, message: "Konuşma silindi (Soft Delete)." };
};
