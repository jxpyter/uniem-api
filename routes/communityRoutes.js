const express = require("express");
const communityController = require("../controllers/communityController");
const authController = require("../controllers/authController");
const { logAction } = require("../controllers/logController");
const { updateUserActivity } = require("../utils/updateUserActivity");

const router = express.Router();

router.use(authController.protect);
router.use(updateUserActivity);

//DİNAMİK ID ROTALARI SONDA OLMALI
router.get("/items", communityController.getAllItems);
router.route("/items/:id").get(communityController.getItem);

router.get(
  "/feed",
  authController.restrictFreeUser,
  communityController.getFeed
);

router.post(
  "/posts",
  authController.restrictFreeUser,
  communityController.createPost,
  logAction
);
router
  .route("/posts/:id")
  .patch(
    authController.restrictToOwner,
    authController.restrictFreeUser,
    communityController.updatePost,
    logAction
  )
  .delete(
    authController.restrictToOwner,
    authController.restrictFreeUser,
    communityController.deletePost,
    logAction
  );

router
  .route("/items/:id/vote")
  .patch(
    authController.restrictFreeUser,
    communityController.voteItem,
    logAction
  );
router.post(
  "/items/:id/comment",
  authController.restrictFreeUser,
  communityController.writeComment,
  logAction
);
router.patch(
  "/items/:itemId/comment/:commentId",
  authController.restrictToOwner,
  authController.restrictFreeUser,
  communityController.updateComment,
  logAction
);
router.delete(
  "/items/:itemId/comment/:commentId",
  authController.restrictToOwner,
  authController.restrictFreeUser,
  communityController.deleteComment,
  logAction
);

module.exports = router;
