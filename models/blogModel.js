const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Blog başlığı gereklidir."],
    maxlength: [100, "Başlık en fazla 100 karakter olabilir."],
    // minlength: [10, "Başlık en fazla 100 karakter olabilir."],
  },
  content: {
    type: String,
    required: [true, "Blog içeriği gereklidir."],
    // minlength: [500, "Yazı içeriğinizi zenginleştirin."]
  },
  coverImage: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  premium: {
    type: Boolean,
    default: false, // Varsayılan olarak tüm bloglar herkese açık
  },
  readTime: {
    type: Number, // Dakika cinsinden okuma süresi
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Beğeni listesi
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

// **Okuma süresini otomatik hesaplama**
blogSchema.pre("save", function (next) {
  if (this.isModified("content")) {
    const wordsPerMinute = 200; // Ortalama okuma hızı (200 kelime/dk)
    const words = this.content.split(" ").length;
    this.readingTime = Math.ceil(words / wordsPerMinute);
  }
  next();
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
