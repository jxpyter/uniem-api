const User = require("../models/userModel");
const Note = require("../models/noteModel");
const CommunityItem = require("../models/communityModel");
const Ranking = require("../models/rankingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const calculateRank = require("../utils/calculateRank");

// exports.calculateRankings = catchAsync(async (req, res, next) => {
//   const { period } = req.params; // 'weekly', 'monthly', 'yearly'

//   let startDate;
//   const today = new Date();

//   if (period === "weekly")
//     startDate = new Date(today.setDate(today.getDate() - 7));
//   else if (period === "monthly")
//     startDate = new Date(today.setMonth(today.getMonth() - 1));
//   else if (period === "yearly")
//     startDate = new Date(today.setFullYear(today.getFullYear() - 1));
//   else
//     return next(
//       new AppError("Invalid period! Use 'weekly', 'monthly', or 'yearly'.", 400)
//     );

//   const topUploaders = await User.aggregate([
//     { $match: { createdAt: { $gte: startDate } } },
//     {
//       $project: {
//         name: 1,
//         uploadedNotesCount: { $size: "$uploadedNotes" },
//         points: 1,
//       },
//     },
//     { $sort: { uploadedNotesCount: -1 } },
//     { $limit: 10 },
//   ]);

//   const topRatedNotes = await Note.aggregate([
//     { $match: { createdAt: { $gte: startDate } } },
//     { $group: { _id: "$owner", totalRating: { $sum: "$rate" } } },
//     { $sort: { totalRating: -1 } },
//     { $limit: 10 },
//   ]);

//   const topCommunityUsers = await CommunityItem.aggregate([
//     { $match: { createdAt: { $gte: startDate } } },
//     { $group: { _id: "$user", itemCount: { $sum: 1 } } },
//     { $sort: { itemCount: -1 } },
//     { $limit: 10 },
//   ]);

//   const topCommenters = await CommunityItem.aggregate([
//     { $match: { createdAt: { $gte: startDate } } },
//     { $unwind: "$comments" },
//     { $group: { _id: "$comments.user", commentCount: { $sum: 1 } } },
//     { $sort: { commentCount: -1 } },
//     { $limit: 10 },
//   ]);

//   const topLikedUsers = await CommunityItem.aggregate([
//     { $match: { createdAt: { $gte: startDate } } },
//     { $unwind: "$likes" },
//     { $group: { _id: "$likes", totalLikes: { $sum: 1 } } },
//     { $sort: { totalLikes: -1 } },
//     { $limit: 10 },
//   ]);

//   const allUsers = [
//     ...topUploaders,
//     ...topRatedNotes,
//     ...topCommunityUsers,
//     ...topCommenters,
//     ...topLikedUsers,
//   ];

//   // Kullanıcıların rütbelerini hesapla
//   allUsers.forEach((user) => {
//     user.rank = calculateRank(user.points);
//   });

//   if (req) {
//     return res.status(200).json({
//       status: "success",
//       data: {
//         topUploaders,
//         topRatedNotes,
//         topCommunityUsers,
//         topCommenters,
//         topLikedUsers,
//       },
//     });
//   }

//   // Cron job ile sıralamaları kaydet
//   await Ranking.create({
//     period,
//     topUsers: allUsers,
//   });

//   console.log(`🏆 [RANKINGS] ${period} sıralaması güncellendi!`);
// });

exports.calculateRankings = catchAsync(async (reqOrData, res, next) => {
  const period = reqOrData?.params?.period || reqOrData?.period;
  if (!period) return next(new AppError("Period parametresi eksik!", 400));

  let startDate;
  const today = new Date();

  if (period === "weekly")
    startDate = new Date(today.setDate(today.getDate() - 7));
  else if (period === "monthly")
    startDate = new Date(today.setMonth(today.getMonth() - 1));
  else if (period === "yearly")
    startDate = new Date(today.setFullYear(today.getFullYear() - 1));
  else
    return next(
      new AppError("Invalid period! Use 'weekly', 'monthly', or 'yearly'.", 400)
    );

  console.log(`📊 [RANKINGS] ${period} sıralaması hesaplanıyor...`);

  // 📌 1. En çok not yükleyen kullanıcılar
  const topUploaders = await Note.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: "$owner", uploadedNotesCount: { $sum: 1 } } },
    { $sort: { uploadedNotesCount: -1 } },
    { $limit: 10 },
  ]);

  // 📌 2. En çok oy alan not sahipleri
  const topRatedNotes = await Note.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: "$owner", totalRating: { $sum: "$rate" } } },
    { $sort: { totalRating: -1 } },
    { $limit: 10 },
  ]);

  // 📌 3. Community içinde en aktif kullanıcılar (Post, Event, Competition vb.)
  const topCommunityUsers = await CommunityItem.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $group: { _id: "$owner", itemCount: { $sum: 1 } } },
    { $sort: { itemCount: -1 } },
    { $limit: 10 },
  ]);

  // 📌 4. En çok yorum yapan kullanıcılar
  const topCommenters = await CommunityItem.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: "$comments" },
    { $group: { _id: "$comments.user", commentCount: { $sum: 1 } } },
    { $sort: { commentCount: -1 } },
    { $limit: 10 },
  ]);

  // 📌 5. En çok beğeni alan kullanıcılar
  const topLikedUsers = await CommunityItem.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    { $unwind: "$likes" },
    { $group: { _id: "$likes", totalLikes: { $sum: 1 } } },
    { $sort: { totalLikes: -1 } },
    { $limit: 10 },
  ]);

  // 📌 **Tüm kullanıcıları tek bir listeye topla**
  const allUserIds = [
    ...topUploaders.map((u) => u._id),
    ...topRatedNotes.map((u) => u._id),
    ...topCommunityUsers.map((u) => u._id),
    ...topCommenters.map((u) => u._id),
    ...topLikedUsers.map((u) => u._id),
  ].filter((id) => id); // `null` veya `undefined` ID'leri temizle

  // 📌 **Tüm kullanıcıları veritabanından çekerek `points` ekleyelim**
  const userData = await User.find({ _id: { $in: allUserIds } }).select(
    "_id name points"
  );

  // **Kullanıcıları dictionary olarak tut**
  const userMap = {};
  userData.forEach((user) => {
    userMap[user._id.toString()] = {
      _id: user._id,
      name: user.name,
      points: user.points || 0,
    };
  });

  // 📌 **Sıralamaya giren kullanıcıların bilgilerini ve rütbelerini ekle**
  const allUsers = allUserIds
    .map((id) => {
      const user = userMap[id.toString()];
      if (user) {
        return {
          _id: user._id,
          name: user.name,
          points: user.points,
          rank: calculateRank(user.points),
        };
      }
      return null;
    })
    .filter((user) => user !== null); // **Eksik kullanıcıları temizle**

  // 📌 **Eğer API çağrısıysa JSON olarak dön**
  if (res) {
    return res.status(200).json({
      status: "success",
      data: {
        topUploaders,
        topRatedNotes,
        topCommunityUsers,
        topCommenters,
        topLikedUsers,
      },
    });
  }

  // 📌 **Eğer cron job çalıştırıyorsa, sıralamayı kaydet**
  await Ranking.create({
    period,
    topUsers: allUsers,
  });

  console.log(`🏆 [RANKINGS] ${period} sıralaması başarıyla güncellendi!`);
});
