const calculateRank = (points) => {
  if (points >= 100000) return "UNIEM 🏆";
  if (points >= 50000) return "Rektör 👑";
  if (points >= 30000) return "Profesör 📚";
  if (points >= 25000) return "Doçent 🎓";
  if (points >= 20000) return "Akademisyen ✒️";
  if (points >= 15000) return "Usta Mentor 🏅";
  if (points >= 12000) return "Topluluk Lideri 🌍";
  if (points >= 10000) return "Vizyoner 🚀";
  if (points >= 8000) return "Öncü 🔥";
  if (points >= 6000) return "Deneyimli 🌟";
  if (points >= 4000) return "Uzman 📖";
  if (points >= 3000) return "Kıdemli 🎯";
  if (points >= 2000) return "Mentor 🏆";
  if (points >= 1500) return "Girişimci 💡";
  if (points >= 1000) return "Stratejist 🧠";
  if (points >= 750) return "Analist 📊";
  if (points >= 500) return "Keşifçi 🔎";
  if (points >= 250) return "Çalışkan 📜";
  if (points >= 100) return "Yeni Üye 🎈";
  if (points >= 50) return "Çaylak 🍃";
  return "Başlangıç 🌱";
};

module.exports = calculateRank;
