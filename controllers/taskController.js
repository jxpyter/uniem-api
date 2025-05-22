const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Task = require("../models/taskModel");
const User = require("../models/userModel");
const calculateRank = require("../utils/calculateRank");

// ✅ 1. Tüm Görevleri Listele (Herkes Görebilir)
exports.getAllTasks = catchAsync(async (req, res, next) => {
  const { category } = req.query;
  let filter = {};

  if (category) {
    filter.category = category.toUpperCase();
  }

  const tasks = await Task.find(filter).sort("-createdAt");

  res.status(200).json({
    status: "success",
    results: tasks.length,
    data: { tasks },
  });
});

// ✅ 2. Kullanıcının Görev İlerlemesini Getir
exports.getUserTaskProgress = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const currentUser = req.user;

  if (currentUser.id !== userId) {
    return next(
      new AppError(
        "You do not have permission to view this user's progress.",
        403
      )
    );
  }

  const user = await User.findById(userId).populate("taskProgress.task");

  if (!user) {
    return next(new AppError("User not found!", 404));
  }

  const progressData = user.taskProgress
    .map((progress) => {
      const task = progress.task;
      if (!task) return null; // Eğer ilgili görev silindiyse

      const progressPercentage = task.target
        ? ((progress.progress / task.target) * 100).toFixed(2) + "%"
        : "N/A"; // Eğer hedef belirtilmemişse "N/A"

      return {
        taskId: task._id,
        taskName: task.name,
        category: task.category,
        progress: progress.progress,
        target: task.target || "Belirtilmemiş",
        progressPercentage,
        isCompleted: progress.completed,
        earnedBadge: progress.completed ? task.badge : null, // Görev tamamlandıysa kazandığı rozet
        pointsEarned: progress.completed ? task.rewardPoints : 0, // Görev tamamlandıysa kazandığı puan
      };
    })
    .filter(Boolean); // `null` olanları (silinen görevleri) filtrele

  res.status(200).json({
    status: "success",
    data: progressData,
  });
});

// ✅ 3. Kullanıcının tamamladığı görevleri güncelle
exports.completeTask = catchAsync(async (reqOrData, res, next) => {
  const { userId, taskType } = reqOrData.body || reqOrData;

  if (!userId || !taskType) {
    console.error("❌ completeTask: Eksik parametre!", { userId, taskType });
    return res ? next(new AppError("Eksik parametreler!", 400)) : undefined;
  }

  console.log(`🔍 Görev tamamlanıyor: userId=${userId}, taskType=${taskType}`);

  const user = await User.findById(userId);
  if (!user) {
    console.error(`❌ Kullanıcı bulunamadı: ${userId}`);
    return res ? next(new AppError("Kullanıcı bulunamadı!", 404)) : undefined;
  }

  const userTasks = await Task.find({ type: taskType, isActive: true });

  userTasks.forEach((task) => {
    let userTask = user.taskProgress.find(
      (t) => t.task.toString() === task._id.toString()
    );

    if (userTask) {
      userTask.progress += 1;
      if (userTask.progress >= task.target && !userTask.completed) {
        userTask.completed = true;
        user.points += task.points;

        if (task.badge && !user.badges.includes(task.badge)) {
          user.badges.push(task.badge);
          user.title = task.badge;
        }
      }
    } else {
      user.taskProgress.push({
        task: task._id,
        progress: 1,
        completed: task.target === 1,
      });

      if (task.target === 1) {
        user.points += task.points;
        if (task.badge && !user.badges.includes(task.badge)) {
          user.badges.push(task.badge);
          user.title = task.badge;
        }
      }
    }
  });

  user.rank = calculateRank(user.points);
  await user.save({ validateBeforeSave: false });

  console.log(`✅ [TASK] ${user.name} (${userId}) - ${taskType} tamamlandı.`);

  if (res) {
    res.status(200).json({
      status: "success",
      message: `✅ ${taskType} görevi tamamlandı.`,
    });
  }
});
