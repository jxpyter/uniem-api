const cron = require("node-cron");
const User = require("../models/userModel");
const rankingController = require("../controllers/rankingController");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// ⏳ HER GECE 03:00'TE 1 Aydan Eski Logları Temizleme
cron.schedule(
  "0 3 * * *",
  catchAsync(async () => {
    console.log("🗑️ [CRON JOB] Eski loglar temizleniyor...");

    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const deletedLogs = await Log.deleteMany({
      createdAt: { $lte: oneMonthAgo },
    });

    console.log(`✅ ${deletedLogs.deletedCount} adet eski log silindi.`);
  })
);

// ⏳ HER PAZAR GECE 02:00'DE SIRALAMALAR GÜNCELLENECEK
cron.schedule(
  "0 2 * * 0",
  catchAsync(async () => {
    console.log("🏆 [CRON JOB] Kullanıcı sıralamaları güncelleniyor...");

    rankingController.calculateRankings({ params: { period: "weekly" } });
    rankingController.calculateRankings({
      params: { period: "monthly" },
    });
    rankingController.calculateRankings({ params: { period: "yearly" } });

    console.log("✅ Kullanıcı sıralamaları başarıyla güncellendi.");
  })
);

// 📌 HER SAAT BAŞI KULLANICI AKTİFLİĞİ KONTROL EDİLECEK
cron.schedule(
  "0 * * * *", // Her saat başı çalışacak
  catchAsync(async () => {
    console.log("🕒 [CRON JOB] Saatlik aktiflik kontrolü başlatıldı...");

    const currentTime = new Date();
    const oneHourAgo = new Date(currentTime - 60 * 60 * 1000); // 1 saat önce

    // Son 1 saat içinde aktif olan kullanıcıları bul
    const activeUsers = await User.find({
      lastActiveAt: { $gte: oneHourAgo },
    });

    // Aktif kullanıcılara puan ekle
    for (let user of activeUsers) {
      user.points += 3; // Saatlik 3 puan ekle
      await user.save({ validateBeforeSave: false });
    }

    console.log("✅ [CRON JOB] Saatlik aktiflik kontrolü tamamlandı.");
  })
);

// 📌 HER GÜN GİRİŞ YAPANLARA 5 PUAN EKLEME İŞLEMİ
cron.schedule(
  "0 0 * * *", // Her gece 12'de çalışacak
  catchAsync(async () => {
    console.log("🔄 [CRON JOB] Günlük giriş kontrolü başlatıldı...");

    const currentTime = new Date();
    const oneDayAgo = new Date(currentTime - 24 * 60 * 60 * 1000); // 24 saat önce

    // Kullanıcıları kontrol et
    const users = await User.find();

    for (let user of users) {
      // Eğer kullanıcı son 1 saat içinde aktifse ve günlük giriş yapılmamışsa
      if (user.lastActiveAt >= oneDayAgo && !user.dailyLogin) {
        user.points += 5; // Günlük 5 puan ekle
        user.dailyLogin = true; // Günlük giriş yapıldığını işaretle
      } else {
        // Eğer kullanıcı aktif değilse, dailyLogin'ı false yap
        user.dailyLogin = false;
      }

      await user.save({ validateBeforeSave: false });
    }

    console.log("✅ [CRON JOB] Günlük giriş kontrolü tamamlandı.");
  })
);

// 🔥 CRON JOB HATA YÖNETİMİ
process.on("unhandledRejection", (err) => {
  console.error("❌ [CRON JOB] Hata:", err);
  throw new AppError("CRON JOB çalışırken hata oluştu!", 500);
});
