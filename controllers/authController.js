const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const loggedOutTokens = new Set(); // Geçersiz token'ları saklamak için
const User = require("../models/userModel");
const Note = require("../models/noteModel");
const CommunityItem = require("../models/communityModel");
const Blog = require("../models/blogModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  // Varsayılan rol "user" olacak, admin, moderator, manager olarak da atama yapılabilir.
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  createSendToken(newUser, 201, res); // Yeni kullanıcı için token gönderme fonksiyonu
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Lütfen e-posta ve şifre giriniz!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Geçersiz e-posta veya şifre!", 401));
  }

  // 3️⃣ Kullanıcı aktif mi?
  if (!user.isActive) {
    return next(
      new AppError(
        "Hesabınız devre dışı bırakılmış. Lütfen destek ile iletişime geçin.",
        403
      )
    );
  }

  // 4️⃣ Kullanıcı aktifse, askıya alınmış mı kontrol et
  if (user.isSuspended) {
    return next(
      new AppError(
        `Hesabınız askıya alındı! 
      Sebep: ${user.suspensionReason || "Bilinmiyor"}. 
      Süre: ${user.suspensionEndDate ? user.suspensionEndDate.toLocaleString() : "Belirsiz"}.`,
        403
      )
    );
  }

  // 5️⃣ Token oluştur ve kullanıcıya gönder
  createSendToken(user, 200, res);
});

exports.adminLogin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Lütfen e-posta ve şifre giriniz", 400));
  }

  // Kullanıcıyı bul ve şifresini doğrula
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Geçersiz e-posta veya şifre", 401));
  }

  // Eğer kullanıcının rolü "admin" değilse, admin paneline giriş yapamaz
  if (user.role == "user") {
    return next(
      new AppError("Bu panele yalnızca adminler giriş yapabilir!", 403)
    );
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer")
  ) {
    return res.status(401).json({
      status: "fail",
      message: "You are not logged in!",
    });
  }

  const token = req.headers.authorization.split(" ")[1];

  // 🛑 Token'ı geçersiz hale getir
  loggedOutTokens.add(token);

  res.status(200).json({
    success: true,
    message: "Logged out successfully!",
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token || token === "null") {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 🛑 Eğer token logout sırasında geçersiz hale getirildiyse, erişimi engelle
  if (loggedOutTokens.has(token)) {
    return next(new AppError("Session expired. Please log in again.", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  req.user = currentUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //Kullanıcıyı bul.
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  //Random reset token oluştur.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //Kullanıcıya mail gönder
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createSendToken(user, 200, res);
});

// ✅ 1. Kullanıcı sistemde hiçbir notu göremeyecekse engelle
exports.restrictFreeUser = catchAsync(async (req, res, next) => {
  if (req.user.role === "user" && req.user.subscription === "free") {
    return next(
      new AppError(
        "Upgrade your plan to interact with Community platform.",
        403
      )
    );
  }
  next();
});

// ✅ 2. Kullanıcının kendi yükledikleri üzerinde işlem yapmasını sağla
exports.restrictToOwner = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // "Note" ve "CommunityItem" modellerini kontrol et
  let item =
    (await Note.findById(id)) ||
    (await CommunityItem.findById(id)) ||
    (await Blog.findById(id));

  // Eğer içerik bulunamadıysa hata döndür
  if (!item) {
    return next(new AppError("Bu ID ile ilgili içerik bulunamadı!", 404));
  }

  // Eğer kullanıcı bilgisi bulunmazsa hata döndür
  if (!req.user || !req.user.id) {
    return next(new AppError("User not authenticated", 401));
  }

  // "owner" kontrolü yap
  if (item.owner.toString() !== req.user.id) {
    return next(new AppError("Sadece kendi içeriğini düzenleyebilirsin!", 403));
  }

  next();
});
