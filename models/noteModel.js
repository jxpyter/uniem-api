const mongoose = require("mongoose");
const path = require("path"); // ✅ Eksik modülü ekledik

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "A note must have a title."],
    maxlength: [100, "A title must have less or equal then 40 characters."],
    minlength: [10, "A title must have more or equal then 10 characters."],
  },
  slug: String,
  description: String,
  fileUrl: {
    type: String,
    required: [true, "A note must have a file URL."], // ✅ Dosya URL'si zorunlu olsun
  },
  fileType: { type: String, enum: ["pdf", "docx", "pptx"] },
  fileSize: {
    type: String,
    required: true,
  }, // ✅ Dosya boyutunu ekledik

  university: {
    type: String,
    required: [true, "A note must belong to a university."],
  }, // ✅ Üniversite bilgisi

  faculty: {
    type: String,
    required: [true, "A note must belong to a faculty."],
  }, // ✅ Fakülte bilgisi

  department: {
    type: String,
    required: [true, "A note must belong to a department."],
  }, // ✅ Bölüm bilgisi

  class: {
    type: String,
    required: [true, "A note must have a class level."],
    enum: ["1", "2", "3", "4", "5", "6"],
  }, // ✅ Sınıf seviyesi

  course: {
    type: String,
    required: [true, "A note must have a course."],
  }, // ✅ Ders bilgisi
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // ✅ Sahibi zorunlu olsun
  },
  tags: [{ type: String }],

  rate: {
    //bir nota verilecek puan belirlemesi.
    type: Number,
    default: null,
    min: [1, "Rating must be above or equal 1"],
    max: [5, "Rating must be below or equal 5"],
  },
  rateCount: { type: Number, default: 0 }, // Kaç kişi oylamış

  // ⭐ Kullanıcıların hangi notlara oy verdiğini takip etmek için
  rating: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Oy veren kullanıcı
      score: { type: Number, min: 1, max: 5 }, // Verilen puan
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: null,
  },
});

// ✅ Dosyanın tam yolu için sanal bir alan ekleyelim
noteSchema.virtual("filePath").get(function () {
  return this.fileUrl ? path.join(__dirname, "..", this.fileUrl) : null;
});

const Note = mongoose.model("Note", noteSchema);
module.exports = Note;
