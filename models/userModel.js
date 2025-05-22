const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const calculateRank = require("../utils/calculateRank");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name."],
    lowercase: true,
  },
  email: {
    type: String,
    required: [true, "Please tell us your email"],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        // Genel e-posta doğrulaması (isEmail), ardından '.edu.tr' uzantısına bakılır
        if (validator.isEmail(value)) {
          return /@([a-zA-Z0-9._-]+)\.edu\.tr$/.test(value); // Sadece .edu.tr uzantısı
        }
        return false; // Eğer geçerli bir e-posta değilse, false döner
      },
      message: (props) => `${props.value} not a valid .edu.tr extension email!`,
    },
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      //This only works on CREATE and SAVE!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  role: {
    type: String,
    enum: ["user", "moderator", "manager", "admin"],
    default: "user",
  },
  subscription: {
    type: String,
    enum: ["free", "premium", "elite"],
    default: "free",
  },
  profilePicture: String,
  bio: String,
  points: { type: Number, default: 0 },
  rank: { type: String, default: "Başlangıç" },
  thanks: { type: Number, default: 0 },
  thankedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  badges: [{ type: String, default: [] }],
  taskProgress: [
    {
      task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
      progress: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
    },
  ],
  followRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  uploadedBlogs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
  uploadedNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  downloadedNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Note" }],
  warnings: [
    {
      message: { type: String, required: true },
      date: { type: Date, default: Date.now },
      issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Uyarıyı veren admin
    },
  ],
  isPublic: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: String,
  suspensionEndDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  dailyLogin: { type: Boolean, default: false },
  lastActiveAt: { type: Date, default: null },
  deactivationDate: { type: Date, default: null },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.points !== undefined) {
    update.rank = calculateRank(update.points);
  }
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  //false şifre değiştirme yok demek.
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.updateLastActive = function () {
  this.lastActiveAt = Date.now(); // Şu anki zamanı lastActiveAt'a atayın
  return this.save();
};

const User = mongoose.model("User", userSchema);
module.exports = User;
