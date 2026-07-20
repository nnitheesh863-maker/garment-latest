const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const { initSocket } = require("./services/socketService");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth");
const orderRoutes = require("./routes/orders");
const taskRoutes = require("./routes/tasks");
const employeeRoutes = require("./routes/employees");
const machineRoutes = require("./routes/machines");
const inventoryRoutes = require("./routes/inventory");
const qualityRoutes = require("./routes/quality");
const aiRoutes = require("./routes/ai");
const notificationRoutes = require("./routes/notifications");
const productionLineRoutes = require("./routes/productionLines");
const leaveRoutes = require("./routes/leaves");
const learningVideoRoutes = require("./routes/learningVideos");
const defectReportRoutes = require("./routes/defectReports");
const voiceRoutes = require("./routes/voice");

const app = express();
const server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(morgan(process.env.NODE_ENV === "development" ? "dev" : "combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api", limiter);
app.use("/api/orders", orderRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/machines", machineRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/quality", qualityRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/production-lines", productionLineRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/learning-videos", learningVideoRoutes);
app.use("/api/defect-reports", defectReportRoutes);
app.use("/api/voice", voiceRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Garment Production API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    initSocket(server);

    server.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`,
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err.message);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

module.exports = { app, server };
