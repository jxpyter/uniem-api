const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A task must have a title"],
    unique: true,
  },
  description: {
    type: String,
    required: [true, "A task must have a description"],
    unique: true,
  },
  points: {
    type: Number,
    required: [true, "A task must have a point value"],
  },
  badge: {
    type: String, // Görev tamamlanınca kazanılacak rozet
    unique: true,
  },
  target: {
    type: Number,
    required: [true, "A task must have a target number"],
  },
  type: {
    type: String,
    enum: ["NOTE", "BLOG", "USER", "COMMUNITY", "TASK", "COMMENT", "VOTE"],
    required: true,
  },
  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Görevi oluşturan kişi
  },
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
