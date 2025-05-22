const reportService = require("../services/reportService");
const catchAsync = require("../utils/catchAsync");

// exports.reportItem = catchAsync(async (req, res, next) => {
//   const { reportedItem, itemType, reason } = req.body;

//   if (!reason || reason.trim().length === 0) {
//     return next(new AppError("Rapor nedeni boş olamaz!", 400));
//   }

//   if (!reportedItem || !itemType) {
//     return next(new AppError("Raporlanacak bir öğe seçmelisiniz!", 400));
//   }

//   if (!["User", "CommunityItem", "Note", "Blog", "Task"].includes(itemType)) {
//     return next(new AppError("Geçersiz içerik türü!", 400));
//   }

//   const newReport = await Report.create({
//     reporter: req.user.id,
//     reportedItem,
//     itemType,
//     reason,
//   });

//   res.status(201).json({
//     status: "success",
//     message: "Rapor başarıyla oluşturuldu.",
//     data: { report: newReport },
//   });
// });

exports.reportItem = catchAsync(async (req, res, next) => {
  const newReport = await reportService.reportItem(
    req.user.id,
    req.body.reportedItem,
    req.body.itemType,
    req.body.reason
  );

  res.status(201).json({
    status: "success",
    message: "Rapor başarıyla oluşturuldu.",
    data: { report: newReport },
  });
});
