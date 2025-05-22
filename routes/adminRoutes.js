const express = require("express");
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");
const rankingController = require("../controllers/rankingController");
const { logAction } = require("../controllers/logController");

const router = express.Router();

// 🟢 Admin Giriş
router.post("/login", authController.adminLogin);
router.use(authController.protect);

// 🟢 Admin Paneli Anasayfa
router.get(
  "/dashboard",
  adminController.restrictTo("admin", "manager"),
  adminController.getDashboard
);

// 🟢 Sıralamalar
router.get("/rankings/:period", rankingController.calculateRankings);

// 📌 **Kullanıcı Yönetimi (İzinli)**
router
  .route("/users")
  .get(authController.protect, adminController.getAllUsers)
  .post(
    authController.protect,
    adminController.restrictTo("admin", "manager"),

    adminController.createUser,
    logAction
  );

router
  .route("/users/:id")
  .patch(
    authController.protect,
    adminController.restrictTo("admin", "manager"),
    //
    adminController.updateUser,
    logAction
  )
  .delete(
    authController.protect,
    adminController.restrictTo("admin", "manager"),

    adminController.deleteUser,
    logAction
  );

router.get(
  "/users/:id/warnings",
  authController.protect,
  adminController.getWarnings
);

router.post(
  "/users/:id/warn",
  authController.protect,

  adminController.warnUser,
  logAction
);

router.get(
  "/users/suspended",
  authController.protect,
  adminController.viewAllSuspendedUser
);

router.post(
  "/users/:id/suspend",
  authController.protect,

  adminController.suspendUser,
  logAction
);

router.post(
  "/users/:id/unsuspend",
  authController.protect,
  adminController.restrictTo("admin", "manager"),

  adminController.unsuspendUser,
  logAction
);

// 📌 **Görev Yönetimi (İzinli)**
router
  .route("/tasks")
  .get(authController.protect, adminController.getAllTasks)
  .post(
    authController.protect,
    adminController.restrictTo("admin", "manager"),
    adminController.createTask,
    logAction
  );

router
  .route("/tasks/:id")
  .patch(
    authController.protect,
    adminController.restrictTo("admin", "manager"),
    adminController.updateTask,
    logAction
  )
  .delete(
    authController.protect,
    adminController.restrictTo("admin", "manager"),
    adminController.deleteTask,
    logAction
  );

// 📌 **Not Yönetimi (İzinli)**
router.route("/notes").get(authController.protect, adminController.getAllNotes);

router
  .route("/notes/:id")
  .get(authController.protect, adminController.getNote)
  .patch(authController.protect, adminController.updateNote, logAction)
  .delete(authController.protect, adminController.deleteNote, logAction);

// 📌 **İçerik Yönetimi (İzinli)**
router
  .route("/community/items")
  .get(authController.protect, adminController.getAllCommunityItems)
  .post(authController.protect, adminController.createCommunityItem, logAction);

router
  .route("/community/items/:id")
  .get(authController.protect, adminController.getCommunityItem)
  .patch(authController.protect, adminController.updateCommunityItem, logAction)
  .delete(
    authController.protect,
    adminController.deleteCommunityItem,
    logAction
  );

// 📌 **Blog (İzinli)**
router
  .route("/blogs")
  .get(authController.protect, adminController.getAllBlogs)
  .post(authController.protect, adminController.createBlog, logAction);

router
  .route("/blogs/:id")
  .patch(authController.protect, adminController.updateBlog, logAction)
  .delete(authController.protect, adminController.deleteBlog, logAction);

// 📌 **Rapor ve İstatistikler (İzinli)**
router.get(
  "/statistics",
  authController.protect,
  adminController.restrictTo("admin", "manager"),
  adminController.getStatistics
);

router.get(
  "/popular-items",
  authController.protect,
  adminController.getPopularCommunityItems
);

router.get(
  "/stats/subscriptions",
  authController.protect,
  adminController.restrictTo("admin", "manager"),
  adminController.getSubscriptionStats
);

router.get("/reports", authController.protect, adminController.getReports);

router.get(
  "/reports/:id",
  authController.protect,
  adminController.reviewReport
);

router.patch(
  "/reports/:reportId/:action",
  authController.protect,
  adminController.takeActionOnReport,
  logAction
);

router.get(
  "/logs",
  authController.protect,
  adminController.restrictTo("admin", "manager"),
  adminController.getLogs
);

module.exports = router;
