const CommunityItem = require("../models/communityModel");
const { APICommunityFeatures } = require("../utils/apiFeatures");
const AppError = require("../utils/appError");

exports.getAllItems = async (query) => {
  const features = new APICommunityFeatures(CommunityItem.find(), query)
    .filter() // Filtreleme
    .search() // Arama
    .sort() // Sıralama
    .limitFields() // Alan Seçimi
    .paginate(); // Sayfalama

  return await features.query;
};

exports.getItem = async (id) => {
  const item = await CommunityItem.findById(id).populate("owner", "name");
  if (!item) throw new AppError("No item found with that ID", 404);
  return item;
};

exports.createPost = async (userId, postData) => {
  const { title, content, category, tags, media } = postData;

  // Kategori, stringse ve virgülle ayrılmışsa, bir diziye dönüştürülür.
  const categoryArray = Array.isArray(category)
    ? category
    : category
      ? category.split(",").map((c) => c.trim())
      : [];

  const newPost = await CommunityItem.create({
    owner: userId,
    type: "post",
    title,
    content,
    category: categoryArray, // Artık kategori bir dizi olacak
    tags: tags ? tags.split(",").map((t) => t.trim()) : [], // Tags zaten virgüllere ayrılacak
    media,
  });

  return newPost;
};

exports.updatePost = async (userId, postId, postData) => {
  const item = await CommunityItem.findById(postId);

  if (!item || item.type !== "post") {
    throw new AppError("Bu ID ile post bulunamadı!", 404);
  }

  if (item.owner.toString() !== userId) {
    throw new AppError("Bu postu düzenleme yetkiniz yok!", 403);
  }

  item.title = postData.title || item.title;
  item.content = postData.content || item.content;
  item.media = postData.media || item.media;
  item.tags = postData.tags
    ? postData.tags.split(",").map((t) => t.trim())
    : item.tags;
  item.category = postData.category
    ? postData.category.split(",").map((c) => c.trim())
    : item.category;

  await item.save();
  return item;
};

exports.deletePost = async (userId, postId) => {
  const item = await CommunityItem.findById(postId);

  if (!item || item.type !== "post") {
    throw new AppError("Bu ID ile post bulunamadı!", 404);
  }

  if (item.owner.toString() !== userId) {
    throw new AppError("Bu postu silme yetkiniz yok!", 403);
  }

  await CommunityItem.findByIdAndDelete(postId);
};

exports.voteItem = async (userId, itemId) => {
  const item = await CommunityItem.findById(itemId);
  if (!item) throw new AppError("Item not found.", 404);

  const likedIndex = item.likes.indexOf(userId);

  if (likedIndex === -1) {
    item.likes.push(userId);
    item.likesCount += 1;
  } else {
    item.likes.splice(likedIndex, 1);
    item.likesCount -= 1;
  }

  await item.save();
  return { item, liked: likedIndex === -1 };
};

exports.writeComment = async (userId, itemId, text) => {
  if (!text || text.trim().length === 0) {
    throw new AppError("Comment cannot be empty.", 400);
  }

  const item = await CommunityItem.findById(itemId);
  if (!item) throw new AppError("Item not found.", 404);

  const newComment = {
    owner: userId,
    text: text.trim(),
    createdAt: Date.now(),
  };

  item.comments.push(newComment);
  await item.save({ validateBeforeSave: false });

  return item;
};

exports.updateComment = async (
  userId,
  itemId,
  commentId,
  newText,
  userRole
) => {
  if (!newText || newText.trim().length === 0) {
    throw new AppError("Yorum boş olamaz!", 400);
  }

  const item = await CommunityItem.findById(itemId);
  if (!item) throw new AppError("Bu ID ile içerik bulunamadı!", 404);

  const comment = item.comments.id(commentId);
  if (!comment) throw new AppError("Bu ID ile yorum bulunamadı!", 404);

  // Kullanıcı admin değilse sadece kendi yorumunu düzenleyebilir
  if (
    comment.owner.toString() !== userId &&
    !["admin", "manager", "moderator"].includes(userRole)
  ) {
    throw new AppError("Bu yorumu düzenleme yetkiniz yok!", 403);
  }

  comment.text = newText;
  comment.editedAt = Date.now();
  await item.save();

  return comment;
};

exports.deleteComment = async (userId, itemId, commentId, userRole) => {
  const item = await CommunityItem.findById(itemId);
  if (!item) throw new AppError("Bu ID ile içerik bulunamadı!", 404);

  const comment = item.comments.id(commentId);
  if (!comment) throw new AppError("Bu ID ile yorum bulunamadı!", 404);

  // Kullanıcı admin değilse sadece kendi yorumunu silebilir
  if (
    comment.owner.toString() !== userId &&
    !["admin", "manager", "moderator"].includes(userRole)
  ) {
    throw new AppError("Bu yorumu silme yetkiniz yok!", 403);
  }

  comment.deleteOne();
  await item.save();
};

exports.getFeed = async (followingList) => {
  if (!followingList.length) {
    throw new AppError("Henüz kimseyi takip etmiyorsunuz!", 404);
  }

  const items = await CommunityItem.find({ owner: { $in: followingList } })
    .sort("-createdAt")
    .populate("owner", "name profilePicture");

  return items;
};
