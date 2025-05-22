const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const noteRouter = require("./routes/noteRoutes");
const userRouter = require("./routes/userRoutes");
const blogRouter = require("./routes/blogRoutes");
const communityRouter = require("./routes/communityRoutes");
const taskRouter = require("./routes/taskRoutes");
const messageRouter = require("./routes/messageRoutes");
const reportRouter = require("./routes/reportRoutes");
const adminRouter = require("./routes/adminRoutes");
const notificationRouter = require("./routes/notificationRoutes");

const { watchUserChanges } = require("./controllers/watchUserChanges");

const app = express();

//1) MIDDLEWARES

//Set security HTTP headers
app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});

app.use("/api", limiter);
app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());
app.use(
  hpp({
    whitelist: ["rate", "category"],
  })
);

app.use("/api/v1/notes", noteRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/community", communityRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/report", reportRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/notifications", notificationRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can not find ${req.originalUrl} on this server!`, 404));
});

watchUserChanges();

app.use(globalErrorHandler);

module.exports = app;
