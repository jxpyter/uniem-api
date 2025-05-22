const express = require("express");
const blogController = require("../controllers/blogController");
const authController = require("../controllers/authController");
const { updateUserActivity } = require("../utils/updateUserActivity");

const router = express.Router();

router.use(authController.protect);
router.use(updateUserActivity);

router.route("/").get(blogController.getAllBlogs);
router.route("/:id").get(blogController.getBlog);
router.patch("/:id/like", blogController.likeBlog);

module.exports = router;
