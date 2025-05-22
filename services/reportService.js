const Report = require("../models/reportModel");
const AppError = require("../utils/appError");

exports.reportItem = async (reporterId, reportedItem, itemType, reason) => {
  if (!reason || reason.trim().length === 0) {
    throw new AppError("Rapor nedeni boş olamaz!", 400);
  }

  if (!reportedItem || !itemType) {
    throw new AppError("Raporlanacak bir öğe seçmelisiniz!", 400);
  }

  if (!["User", "CommunityItem", "Note", "Blog", "Task"].includes(itemType)) {
    throw new AppError("Geçersiz içerik türü!", 400);
  }

  return await Report.create({
    reporter: reporterId,
    reportedItem,
    itemType,
    reason,
  });
};
