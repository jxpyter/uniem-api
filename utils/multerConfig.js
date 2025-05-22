const multer = require("multer");
const path = require("path");
const AppError = require("../utils/appError");

// ✅ 1. Dosyanın `dev-data/uploads/` klasörüne kaydedilmesini sağla
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(__dirname, "../dev-data/uploads");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `note-${req.user.id}-${Date.now()}${ext}`);
  },
});

// ✅ 2. Yalnızca belirli dosya türlerine izin ver
const fileFilter = (_req, file, cb) => {
  if ([".pdf", ".docx", ".pptx"].includes(path.extname(file.originalname))) {
    cb(null, true);
  } else {
    cb(new AppError("Only PDF, DOCX, and PPTX files are allowed!", 400), false);
  }
};

// ✅ 3. Dosya yükleme limitini belirle (50MB Max)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
