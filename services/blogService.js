const Blog = require("../models/blogModel");
const { APIBlogFeatures } = require("../utils/apiFeatures");
const AppError = require("./../utils/appError");

exports.getAllBlogs = async (query) => {
  const features = new APIBlogFeatures(Blog.find(), query)
    .filter() //premium filtreleme yapılabilir mesela
    .search() // Arama
    .sort() // Sıralama
    .limitFields() // Alan Seçimi
    .paginate(); // Sayfalama

  return await features.query;
};
exports.getBlog = async (blogId, user) => {
  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new AppError(
      "Blog yazısı bulunamadı. Kaldırılmış veya 100 yıl sonra bulunması için gömülmüş olabilir.",
      404
    );
  }

  // 🛑 Free kullanıcılar premium blogları göremez
  if (blog.premium && user.subscription === "free") {
    throw new AppError("Bu içeriğe erişebilmek için üye olmalısınız!", 403);
  }

  return blog;
};
exports.likeBlog = async (blogId, user) => {
  const blog = await Blog.findById(blogId);
  if (!blog) throw new AppError("Blog bulunamadı!", 404);

  if (blog.premium && user.subscription === "free") {
    throw new AppError(
      "Premium blogları beğenmek için abonelik gerekiyor!",
      403
    );
  }

  let liked = false;

  // ✅ Kullanıcı zaten beğendiyse, beğeniyi geri al
  if (blog.likes.includes(user.id)) {
    blog.likes = blog.likes.filter((like) => like.toString() !== user.id);
    liked = false; // Beğeni kaldırıldı
  } else {
    blog.likes.push(user.id);
    liked = true; // Beğeni eklendi
  }

  await blog.save();

  return { likesCount: blog.likes.length, liked };
};
