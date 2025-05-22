const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, // Raporlayan kullanıcı

  reportedItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "itemType",
  }, // Raporlanan içeriğin ID'si

  itemType: {
    type: String,
    enum: ["User", "CommunityItem", "Note", "Blog", "Task"],
    required: true,
  }, // Raporlanan içeriğin tipi

  reason: { type: String, required: true }, // Şikayet sebebi

  status: {
    type: String,
    enum: ["pending", "reviewed", "resolved"],
    default: "pending",
  }, // Durum takibi

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Report", reportSchema);
