const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const calculateRank = require("./../utils/calculateRank");

//SİSTEM ORTAYA ÇIKTIĞINDA BU ÖZELLİK KALDIRILABİLİR. ADMIN PANELINDEN YÖNETİCİ İŞLEMLERİ HALLEDİLEBİLİR.
exports.watchUserChanges = catchAsync(async () => {
  try {
    const changeStream = User.watch();

    changeStream.on("change", async (change) => {
      if (
        change.operationType === "update" &&
        change.updateDescription.updatedFields.points !== undefined
      ) {
        const userId = change.documentKey._id;
        const newPoints = change.updateDescription.updatedFields.points;

        const newRank = calculateRank(newPoints);
        await User.updateOne({ _id: userId }, { $set: { rank: newRank } });

        console.log(`✅ Kullanıcı ${userId} seviyesi güncellendi: ${newRank}`);
      }
    });
  } catch (err) {
    console.error("❌ Change Stream Başlatılırken Hata:", err);
  }
});
