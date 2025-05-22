const express = require("express");
const noteController = require("../controllers/noteController");
const authController = require("../controllers/authController");
const { logAction } = require("../controllers/logController");
const multer = require("multer");
const create = require("../utils/multerConfig");

const router = express.Router();
const upload = multer({ dest: "dev-data/uploads/" });

router
  .route("/")
  .get(
    authController.protect,
    authController.restrictFreeUser,
    noteController.getAllNotes
  )
  .post(
    authController.protect,
    authController.restrictFreeUser,
    create.single("file"),
    noteController.createNote,
    logAction
  );

router
  .route("/:id")
  .get(
    // NOT İNDİR
    authController.protect,
    authController.restrictFreeUser,
    noteController.downloadNote,
    noteController.getNote,
    logAction
  )
  .patch(
    authController.protect,
    authController.restrictToOwner,
    authController.restrictFreeUser,
    upload.single("file"),
    noteController.updateNote,
    logAction
  )
  .delete(
    authController.protect,
    authController.restrictToOwner,
    authController.restrictFreeUser,
    noteController.deleteNote,
    logAction
  );

router
  .route("/:id/rate")
  .patch(
    authController.protect,
    authController.restrictFreeUser,
    noteController.rateNote,
    logAction
  );

//remove downloaded notes.
router.patch(
  "/removeDownloadedNote/:id",
  authController.protect,
  noteController.removeDownloadedNote
);

module.exports = router;
