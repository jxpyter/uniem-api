const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    deleted_by: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    }, // Soft delete için
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
