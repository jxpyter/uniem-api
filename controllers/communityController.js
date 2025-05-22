const communityService = require("../services/communityService");
const taskController = require("../controllers/taskController");
const catchAsync = require("../utils/catchAsync");

exports.getAllItems = catchAsync(async (req, res, _next) => {
  const items = await communityService.getAllItems(req.query);
  res.status(200).json({
    status: "success",
    result: items.length,
    data: { items },
  });
});

exports.getItem = catchAsync(async (req, res, _next) => {
  const item = await communityService.getItem(req.params.id);
  res.status(200).json({
    status: "success",
    data: { item },
  });
});

exports.createPost = catchAsync(async (req, res, _next) => {
  const newPost = await communityService.createPost(req.user.id, req.body);

  taskController.completeTask({
    body: { userId: req.user.id, taskType: "COMMUNITY" },
  });

  res.status(201).json({
    status: "success",
    data: { post: newPost },
  });
});

exports.updatePost = catchAsync(async (req, res, next) => {
  const updatedPost = await communityService.updatePost(
    req.user.id,
    req.params.id,
    req.body
  );

  await taskController.completeTask(req.user.id, "COMMUNITY");

  res.status(200).json({
    status: "success",
    data: { post: updatedPost },
  });
});

exports.deletePost = catchAsync(async (req, res, next) => {
  await communityService.deletePost(req.user.id, req.params.id);

  res.status(204).json({
    status: "success",
    message: "Post başarıyla silindi.",
  });
});

exports.voteItem = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { item, liked } = await communityService.voteItem(userId, id);

  res.status(200).json({
    status: "success",
    message: liked ? "Item liked!" : "Like removed!",
    data: { item },
  });
});

exports.writeComment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  const item = await communityService.writeComment(userId, id, text);

  res.status(201).json({
    status: "success",
    message: "Comment added successfully.",
    data: { item },
  });
});

exports.updateComment = catchAsync(async (req, res, next) => {
  const { itemId, commentId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const comment = await communityService.updateComment(
    userId,
    itemId,
    commentId,
    text,
    userRole
  );

  res.status(200).json({
    status: "success",
    message: "Yorum başarıyla güncellendi.",
    data: { comment },
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { itemId, commentId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  await communityService.deleteComment(userId, itemId, commentId, userRole);

  res.status(204).json({
    status: "success",
    message: "Yorum başarıyla silindi.",
  });
});

exports.getFeed = catchAsync(async (req, res, next) => {
  const following = req.user.following;

  const items = await communityService.getFeed(following);

  res.status(200).json({
    status: "success",
    results: items.length,
    data: items,
  });
});
