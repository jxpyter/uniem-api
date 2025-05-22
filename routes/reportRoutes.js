const express = require("express");
const reportController = require("../controllers/reportController");
const authController = require("../controllers/authController");
const { logAction } = require("../controllers/logController");

const router = express.Router();

router.post(
  "/",
  authController.protect,
  reportController.reportItem,
  logAction
);

module.exports = router;
