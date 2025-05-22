const mongoose = require("mongoose");

const rankingSchema = new mongoose.Schema({
  period: {
    type: String,
    enum: ["weekly", "monthly", "yearly"],
    required: true,
  },
  topUsers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      points: Number,
      rank: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Ranking", rankingSchema);
