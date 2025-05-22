const logService = require("../services/logService");
const catchAsync = require("../utils/catchAsync");

exports.logAction = catchAsync(async (req, res, next) => {
  if (!req.user) return next(); // Kullanıcı oturumu yoksa log tutma

  const { user, method, originalUrl, ip, headers, body } = req;

  const logData = {
    user: user._id, // Yönetici veya kullanıcı kimliği
    action: `[${method}] ${originalUrl}`, // [GET] /api/v1/admin/notes
    details: body, // İşlem detayları (örneğin, bir kullanıcı oluşturulduysa o kullanıcı verileri)
    ipAddress: ip,
    userAgent: headers["user-agent"], // Cihaz bilgisi
  };

  await logService.createLog(logData);

  next(); // Sonraki middleware'e devam et
});
