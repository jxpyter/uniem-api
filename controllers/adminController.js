const adminService = require("../services/adminService");
const Log = require("../models/logModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};

// ✅ DASHBOARD
exports.getDashboard = catchAsync(async (req, res, next) => {
  const dashboardStats = await adminService.getDashboardStats(); // Service'den dashboard istatistiklerini alıyoruz

  res.status(200).json({
    status: "success",
    data: dashboardStats, // Service'den aldığımız veriyi döndürüyoruz
  });
});

//
// ✅ 1. KULLANICI YÖNETİMİ (User Management)
exports.getAllUsers = catchAsync(async (req, res, next) => {
  // Admin servisinden kullanıcıları alıyoruz
  const { users, count } = await adminService.getAllUsers();

  // HTTP yanıtını döndürüyoruz
  res.status(200).json({
    status: "success",
    result: count,
    data: users,
  });
});
exports.createUser = catchAsync(async (req, res, next) => {
  // Admin service'e kullanıcı oluşturma isteği gönderiyoruz
  const newUser = await adminService.createUser(req.body, req.user);

  // Kullanıcı oluşturulmuşsa, HTTP yanıtı gönderiyoruz
  res.status(201).json({
    status: "success",
    data: { user: newUser },
  });
});
exports.updateUser = catchAsync(async (req, res, next) => {
  // Admin service'e kullanıcı güncelleme isteği gönderiyoruz
  const updatedUser = await adminService.updateUser(
    req.params.id,
    req.body,
    req.user
  );

  // Güncellenmiş kullanıcı ile HTTP yanıtını döndürüyoruz
  res.status(200).json({
    status: "success",
    data: updatedUser,
  });
});
exports.deleteUser = catchAsync(async (req, res, next) => {
  // Admin service'e kullanıcı silme isteği gönderiyoruz
  await adminService.deleteUser(req.params.id, req.user);

  // Kullanıcı başarıyla silindiyse, yanıt gönderiyoruz
  res.status(204).json({ status: "success", data: null });
});
exports.viewAllSuspendedUser = catchAsync(async (req, res, next) => {
  // Admin service'e aktif olmayan kullanıcıları getiriyoruz
  const bannedUsers = await adminService.viewAllSuspendedUser();

  // Kullanıcıları ve sayıyı döndürüyoruz
  res.status(200).json({
    status: "success",
    results: bannedUsers.length,
    data: bannedUsers,
  });
});
exports.warnUser = catchAsync(async (req, res, next) => {
  const { id } = req.params; // Uyarılacak kullanıcının ID'si
  const { warningMessage } = req.body; // Uyarı mesajı

  // Admin service'e kullanıcı uyarı işlemi gönderiyoruz
  await adminService.warnUser(id, warningMessage, req.user);

  // Başarılı yanıt gönderiyoruz
  res.status(200).json({
    status: "success",
    message: "Kullanıcıya uyarı gönderildi!",
  });
});
exports.getWarnings = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // AdminService'den getUserWarnings fonksiyonunu çağırıyoruz
  const warnings = await adminService.getUserWarnings(id);

  res.status(200).json({
    status: "success",
    results: warnings.length,
    data: warnings,
  });
});
exports.suspendUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { reason, duration } = req.body;

  // AdminService'den suspendUser fonksiyonunu çağırıyoruz
  const user = await adminService.suspendUser(id, reason, duration);

  res.status(200).json({
    status: "success",
    message: `Kullanıcı ${duration ? duration + " günlüğüne" : "süresiz"} askıya alındı: ${user.email}`,
  });
});
exports.unsuspendUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // AdminService'den unsuspendUser fonksiyonunu çağırıyoruz
  const user = await adminService.unsuspendUser(id);

  res.status(200).json({
    status: "success",
    message: "Kullanıcının askıya alma işlemi kaldırıldı!",
    data: user,
  });
});

//
// ✅ 2. NOT YÖNETİMİ (Note Management)
exports.getAllNotes = catchAsync(async (req, res, next) => {
  const notes = await adminService.getAllNotes();
  res
    .status(200)
    .json({ status: "success", result: notes.length, data: { notes } });
});
exports.getNote = catchAsync(async (req, res, next) => {
  const note = await adminService.getNote(req.params.id);
  if (!note) return next(new AppError("Not bulunamadı!", 404));

  res.status(200).json({ status: "success", data: { note } });
});
exports.updateNote = catchAsync(async (req, res, next) => {
  const note = await adminService.updateNote(req.params.id, req.body);
  if (!note) return next(new AppError("Not bulunamadı!", 404));

  res.status(200).json({ status: "success", data: { note } });
});
exports.deleteNote = catchAsync(async (req, res, next) => {
  await adminService.deleteNote(req.params.id);
  res.status(204).json({ status: "success", data: null });
});

//
// ✅ 3. GÖREV YÖNETİMİ (Task Management)
exports.getAllTasks = catchAsync(async (req, res, next) => {
  const tasks = await adminService.getAllTasks(); // Service'e yönlendiriyoruz
  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: tasks,
  });
});
exports.createTask = catchAsync(async (req, res, next) => {
  // Kullanıcı rolü kontrolünü controller'da tutuyoruz
  if (!["admin", "manager", "moderator"].includes(req.user.role)) {
    return next(
      new AppError("You do not have permission to create tasks.", 403)
    );
  }

  // Admin service'e yönlendiriyoruz
  const newTask = await adminService.createTask(req.body, req.user.id);

  res.status(201).json({
    status: "success",
    data: newTask,
  });
});
exports.updateTask = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Admin service'e yönlendiriyoruz
  const updatedTask = await adminService.updateTask(id, req.body);

  if (!updatedTask) {
    return next(new AppError("Görev bulunamadı!", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Görev başarıyla güncellendi!",
    data: updatedTask,
  });
});
exports.deleteTask = catchAsync(async (req, res, next) => {
  // Admin rolü kontrolü
  if (req.user.role !== "admin") {
    return next(new AppError("Only admins can delete tasks.", 403));
  }

  // Admin service'e yönlendiriyoruz
  await adminService.deleteTask(req.params.id);

  res.status(204).json({ status: "success", data: null });
});

//
// ✅ 4. İÇERİK YÖNETİMİ (Content Management)
exports.getAllCommunityItems = catchAsync(async (req, res, next) => {
  const items = await adminService.getAllCommunityItems(req.query);

  res.status(200).json({
    status: "success",
    result: items.length,
    data: { items },
  });
});
exports.getCommunityItem = catchAsync(async (req, res, next) => {
  const item = await adminService.getCommunityItem(req.params.id);

  res.status(200).json({
    status: "success",
    data: { item },
  });
});
exports.createCommunityItem = catchAsync(async (req, res, next) => {
  const newItem = await adminService.createCommunityItem(req.body, req.user.id);

  res.status(201).json({
    status: "success",
    data: { item: newItem },
  });
});
exports.updateCommunityItem = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, content, media, tags, category, eventDate } = req.body;

  // Service fonksiyonunu çağır ve sonucu döndür
  const updatedItem = await adminService.updateCommunityItem(id, {
    title,
    content,
    media,
    tags,
    category,
    eventDate,
  });

  res.status(200).json({
    status: "success",
    data: { item: updatedItem },
  });
});
exports.deleteCommunityItem = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Service fonksiyonunu çağır ve sonucu döndür
  await adminService.deleteCommunityItem(id);

  res.status(204).json({
    status: "success",
    message: "İçerik başarıyla silindi.",
  });
});

//
// ✅ 5. BLOG YÖNETİMİ (Blog Management)
exports.getAllBlogs = catchAsync(async (req, res, _next) => {
  const blogs = await adminService.getAllBlogs();
  res.status(200).json({
    success: true,
    results: blogs.length,
    data: blogs,
  });
});
exports.createBlog = catchAsync(async (req, res, _next) => {
  const newBlog = await adminService.createBlog(req.user.id, req.body);
  res.status(201).json({
    success: true,
    data: newBlog,
  });
});
exports.updateBlog = catchAsync(async (req, res, _next) => {
  const updatedBlog = await adminService.updateBlog(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: updatedBlog,
  });
});
exports.deleteBlog = catchAsync(async (req, res, _next) => {
  await adminService.deleteBlog(req.params.id);
  res.status(204).json({
    success: true,
    data: null,
  });
});

//
// ✅ 6. RAPOR VE İSTATİSTİKLER
exports.getReports = catchAsync(async (req, res, next) => {
  const reports = await adminService.getReports();

  res.status(200).json({
    status: "success",
    results: reports.length,
    data: { reports },
  });
});
exports.reviewReport = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const report = await adminService.reviewReport(id);

  if (!report) {
    return next(new AppError("Rapor bulunamadı!", 404));
  }

  res.status(200).json({
    status: "success",
    data: report,
  });
});
exports.takeActionOnReport = catchAsync(async (req, res, next) => {
  const { reportId, action } = req.params;
  const response = await adminService.takeActionOnReport(reportId, action);

  if (response.error) {
    return next(new AppError(response.error, 400));
  }

  res.status(200).json({
    status: "success",
    message: response.message,
  });
});
exports.getStatistics = catchAsync(async (req, res, next) => {
  const statistics = await adminService.getStatistics();

  res.status(200).json({
    status: "success",
    data: statistics,
  });
});
exports.getPopularCommunityItems = catchAsync(async (req, res, next) => {
  const popularItems = await adminService.getPopularCommunityItems();

  res.status(200).json({
    status: "success",
    data: popularItems,
  });
});
exports.getSubscriptionStats = catchAsync(async (req, res, next) => {
  const subscriptionStats = await adminService.getSubscriptionStats(); // Service'den veriyi al

  res.status(200).json({
    status: "success",
    data: subscriptionStats, // Dönen veriyi response olarak gönder
  });
});

//
// ✅ 7. LOG YÖNETİMİ (Log Management)
exports.getLogs = catchAsync(async (req, res, next) => {
  const {
    userId,
    action,
    dateStart,
    dateEnd,
    page = 1,
    limit = 10,
  } = req.query;

  // Sayfalama ve filtreleme
  const query = {};
  if (userId) query.user = userId;
  if (action) query.action = action;
  if (dateStart && dateEnd) {
    query.createdAt = { $gte: new Date(dateStart), $lte: new Date(dateEnd) };
  }

  const logs = await Log.find(query)
    .populate("user", "name email role")
    .sort({ createdAt: 1 }) //-1 ken en eski log en üstteydi.
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({
    status: "success",
    results: logs.length,
    data: logs,
  });
});
