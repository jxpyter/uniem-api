const mongoose = require("mongoose");

const communityCategories = [
  "technology", // Teknoloji
  "science", // Bilim
  "programming", // Yazılım & Kodlama
  "gaming", // Oyun Dünyası
  "movies", // Filmler & TV Dizileri
  "music", // Müzik & Sanat
  "sports", // Spor
  "fitness", // Fitness & Sağlık
  "food", // Yemek & Tarifler
  "travel", // Seyahat & Gezi
  "history", // Tarih
  "philosophy", // Felsefe
  "education", // Eğitim & Öğrenme
  "books", // Kitaplar & Edebiyat
  "news", // Güncel Haberler
  "memes", // Mizah & Memler
  "crypto", // Kripto Paralar & Blockchain
  "business", // İş Dünyası & Girişimcilik
  "finance", // Finans & Ekonomi
  "marketing", // Dijital Pazarlama
  "design", // Grafik & UI/UX Tasarım
  "photography", // Fotoğrafçılık
  "automotive", // Otomotiv & Arabalar
  "politics", // Siyaset
  "relationships", // İlişkiler & Aile
  "parenting", // Ebeveynlik
  "self-improvement", // Kişisel Gelişim
  "mental-health", // Ruh Sağlığı & Psikoloji
  "anime", // Anime & Manga
  "fashion", // Moda & Giyim
  "home", // Ev & Dekorasyon
  "diy", // DIY (Kendin Yap) Projeleri
  "pets", // Evcil Hayvanlar
  "nature", // Doğa & Çevre
  "random", // Rastgele Konular
];

const communitySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: ["post", "event", "giveaway", "competition", "announcement"],
    required: true,
  },
  title: {
    type: String,
    required: function () {
      return this.type !== "post"; // Sadece postlar başlıksız olabilir
    },
  },
  content: {
    type: String,
    required: true,
  },
  media: [String], // Resim, video veya dosya linkleri
  category: { type: [String], enum: communityCategories, required: true },
  tags: [String], // 🔹 Etiketleme sistemi
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  likesCount: { type: Number, default: 0 },
  comments: [
    {
      owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // 🔹 Etkinlik / Yarışma / Çekiliş İçin Ek Alanlar
  eventDate: Date, // Etkinlik tarihi
  winners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Çekiliş / Yarışma kazananları
});

const CommunityItem = mongoose.model("CommunityItem", communitySchema);
module.exports = CommunityItem;
