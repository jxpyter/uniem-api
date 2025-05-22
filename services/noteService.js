const path = require("path");
const fs = require("fs");
const Note = require("../models/noteModel");
const User = require("../models/userModel");
const { APINoteFeatures } = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

exports.getAllNotes = async (query) => {
  const features = new APINoteFeatures(Note.find(), query)
    .filter()
    .search()
    .sort()
    .limitFields()
    .paginate();
  return await features.query;
};

exports.getNote = async (id) => {
  const note = await Note.findById(id);
  if (!note) {
    throw new AppError("Not bulunamadı.", 404);
  }
  return note;
};

exports.createNote = async (user, file, body) => {
  if (user.role === "user" && user.subscription === "free") {
    throw new AppError(
      "Free users cannot upload notes. Upgrade your plan.",
      403
    );
  }

  if (!file) {
    throw new AppError("A file is required to upload a note!", 400);
  }

  const fileSizeMB = file.size / (1024 * 1024);
  const maxFileSize =
    ["admin", "manager", "moderator"].includes(user.role) ||
    user.subscription === "elite"
      ? 50 * 1024 * 1024
      : user.subscription === "premium"
        ? 10 * 1024 * 1024
        : 0;

  if (file.size > maxFileSize) {
    throw new AppError(
      `File size exceeds limit! Max size: ${maxFileSize / (1024 * 1024)}MB.`,
      403
    );
  }

  const filePath = path.join("dev-data/uploads", file.filename);
  const fileType = path.extname(file.originalname).slice(1);

  const newNote = await Note.create({
    ...body,
    owner: user.id,
    tags: body.tags ? body.tags.split(",").map((tag) => tag.trim()) : [],
    fileUrl: filePath,
    fileSize: `${fileSizeMB.toFixed(1)} MB`,
    fileType,
  });

  user.uploadedNotes.push(newNote._id);
  await user.save({ validateBeforeSave: false });

  return newNote;
};

exports.updateNote = async (noteId, updateData, file) => {
  const note = await Note.findById(noteId);
  if (!note) {
    throw new AppError("No note found with that ID", 404);
  }

  let isUpdated = false;
  let updatableFields = {};

  // ✅ Güncellenebilir alanları kontrol et
  const updatableKeys = ["title", "description", "class", "course"];
  updatableKeys.forEach((field) => {
    if (updateData[field] && updateData[field] !== note[field]) {
      updatableFields[field] = updateData[field];
      isUpdated = true;
    }
  });

  // ✅ Eğer yeni dosya varsa, eskiyi sil ve yenisini kaydet
  if (file) {
    if (note.fileUrl) {
      const oldFilePath = path.join(__dirname, "..", note.fileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    updatableFields.fileUrl = file.path;
    updatableFields.fileSize = (file.size / (1024 * 1024)).toFixed(2);
    updatableFields.fileType = path.extname(file.originalname).slice(1);
    isUpdated = true;
  }

  // ✅ Eğer değişiklik varsa güncelleme tarihi ekleyelim
  if (isUpdated) {
    updatableFields.updatedAt = Date.now();
  } else {
    return { message: "No changes detected, note remains the same." };
  }

  const updatedNote = await Note.findByIdAndUpdate(noteId, updatableFields, {
    new: true,
    runValidators: true,
  });

  return updatedNote;
};

exports.deleteNote = async (noteId) => {
  const note = await Note.findById(noteId);
  if (!note) {
    throw new AppError("No note found with that ID", 404);
  }

  console.log("Silinecek Dosya URL:", note.fileUrl);

  if (note.fileUrl) {
    let filePath = note.fileUrl;

    if (!path.isAbsolute(filePath)) {
      filePath = path.join(__dirname, "..", filePath);
    }

    filePath = path.normalize(filePath);

    console.log("Tam Dosya Yolu:", filePath);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log("✅ Dosya Başarıyla Silindi:", filePath);
      } catch (error) {
        console.log("❌ Dosya Silme Hatası:", error);
      }
    } else {
      console.log("⚠️ Dosya Zaten Mevcut Değil:", filePath);
    }
  }

  await Note.findByIdAndDelete(noteId);

  // ✅ Notu yöneticiler siliyorsa, sahibinin uploadedNotes listesinden kaldır
  await User.findByIdAndUpdate(note.owner, {
    $pull: { uploadedNotes: noteId },
  });

  console.log("✅ Kullanıcının uploadedNotes listesi güncellendi!");
  return true; // Başarıyla silindiğini belirtmek için
};

exports.rateNote = async (noteId, userId, rating) => {
  // ✅ 1. Notu Bul
  const note = await Note.findById(noteId);
  if (!note) {
    throw new AppError("Not bulunamadı!", 404);
  }

  // ✅ 2. Kullanıcı Daha Önce Oy Vermiş mi Kontrol Et
  const existingRating = note.rating.find((r) => r.user.toString() === userId);
  if (existingRating) {
    throw new AppError("Bu nota zaten oy verdiniz!", 400);
  }

  // ✅ 3. Oy Bilgilerini Güncelle
  note.rating.push({ user: userId, score: rating });
  note.rateCount += 1;

  // ✅ 4. Yeni Ortalama Puanı Hesapla
  const totalScore = note.rating.reduce((sum, r) => sum + r.score, 0);
  note.rate = (totalScore / note.rateCount).toFixed(2);

  // ✅ 5. Notu Kaydet
  await note.save();

  return note;
};

exports.downloadNote = async (userId, noteId) => {
  const note = await Note.findById(noteId);
  if (!note) {
    throw new AppError("No note found with that ID", 404);
  }

  const user = await User.findById(userId);
  if (!user.downloadedNotes.includes(note.id)) {
    user.downloadedNotes.push(note.id);
    user.passwordConfirm = undefined; // sensitive data removal
    await user.save({ validateBeforeSave: false });
  }

  return note;
};

exports.removeDownloadedNote = async (userId, noteId) => {
  const user = await User.findById(userId);
  if (!user.downloadedNotes.includes(noteId)) {
    throw new AppError("This note is not in your downloaded list.", 400);
  }

  user.downloadedNotes = user.downloadedNotes.filter(
    (noteId) => noteId.toString() !== noteId
  );
  await user.save({ validateBeforeSave: false });
};
