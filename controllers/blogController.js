const blogService = require("../services/blogService");
const catchAsync = require("./../utils/catchAsync");

exports.getAllBlogs = catchAsync(async (req, res, _next) => {
  const blogs = await blogService.getAllBlogs(req.query);

  res.status(200).json({
    success: true,
    results: blogs.length,
    data: blogs,
  });
});
exports.getBlog = catchAsync(async (req, res, _next) => {
  const blog = await blogService.getBlog(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: { blog },
  });
});
exports.likeBlog = catchAsync(async (req, res, _next) => {
  const { likesCount, liked } = await blogService.likeBlog(
    req.params.id,
    req.user
  );

  res.status(200).json({
    success: true,
    message: liked ? "Bu yazıyı beğendin. 👍" : "Beğeni kaldırıldı. 👎",
    likes: likesCount,
  });
});
