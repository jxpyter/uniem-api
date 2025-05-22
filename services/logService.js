const Log = require("../models/logModel");

// Yeni log kaydı oluştur
const createLog = async (logData) => {
  try {
    const log = await Log.create(logData);
    return log;
  } catch (err) {
    console.error("Log kaydı oluşturulurken hata oluştu:", err);
    throw new Error("Log kaydı oluşturulamadı");
  }
};

module.exports = { createLog };
