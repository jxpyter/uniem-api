const noteService = require("../services/noteService");
const taskController = require("./taskController");
const userController = require("../controllers/userController");
const catchAsync = require("../utils/catchAsync");

exports.getAllNotes = catchAsync(async (req, res, next) => {
  const notes = await noteService.getAllNotes(req.query);

  res.status(200).json({
    status: "success",
    result: notes.length,
    data: { notes },
  });
});

exports.getNote = catchAsync(async (req, res, next) => {
  const note = await noteService.getNote(req.params.id);

  res.status(200).json({
    status: "success",
    data: { note },
  });
});

exports.createNote = catchAsync(async (req, res, next) => {
  const newNote = await noteService.createNote(req.user, req.file, req.body);

  // ✅ Kullanıcı not yükleme görevini tamamladı
  taskController.completeTask({ userId: req.user.id, taskType: "NOTE" });

  res.status(201).json({
    status: "success",
    data: { note: newNote },
  });
});

exports.updateNote = catchAsync(async (req, res, next) => {
  console.log("🔹 Güncelleme isteği geldi!");

  const updatedNote = await noteService.updateNote(
    req.params.id,
    req.body,
    req.file
  );

  if (updatedNote.message) {
    return res
      .status(200)
      .json({ status: "success", message: updatedNote.message });
  }

  res.status(200).json({
    status: "success",
    data: { note: updatedNote },
  });
});

exports.deleteNote = catchAsync(async (req, res, next) => {
  await noteService.deleteNote(req.params.id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.rateNote = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.user.id;

  const note = await noteService.rateNote(id, userId, rating);

  taskController.completeTask(userId, "vote");
  userController.updateUserPoints(note.owner, rating);

  res.status(200).json({
    success: true,
    message: "Puan başarıyla verildi!",
    data: note,
  });
});

exports.downloadNote = catchAsync(async (req, res, next) => {
  const note = await noteService.downloadNote(req.user.id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Note downloaded successfully",
    data: { note },
  });
});

exports.removeDownloadedNote = catchAsync(async (req, res, next) => {
  await noteService.removeDownloadedNote(req.user.id, req.params.id);

  res.status(200).json({
    status: "success",
    message: "Note removed from downloaded list.",
  });
});
