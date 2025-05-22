const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");

exports.updateUserActivity = catchAsync(async (req, _res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId);
  const currentTime = new Date();

  // Kullanıcının son aktiflik zamanını güncelle
  user.lastActiveAt = currentTime;

  // Eğer kullanıcı günde ilk kez giriş yaptıysa 5 puan ekle
  if (!user.dailyLogin) {
    user.points += 5; // Günlük giriş yaptıysa 5 puan ekle
    user.dailyLogin = true; // Günlük giriş olarak işaretle
  }

  // Eğer kullanıcı 1 saat aktif kaldıysa 3 puan ekle
  const oneHourAgo = new Date(currentTime - 60 * 60 * 1000); // 1 saat önceki zaman
  if (user.lastActiveAt >= oneHourAgo) {
    user.points += 3;
  }

  // Değişiklikleri kaydedelim
  await user.save({ validateBeforeSave: false });

  next();
});
