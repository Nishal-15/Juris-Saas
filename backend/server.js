require("dotenv").config();

process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] Uncaught Exception:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL] Unhandled Rejection at:", promise, "reason:", reason);
});

const express = require("express");
const http = require("http");
const cors = require("cors");
const socketio = require("socket.io");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
require("./utils/scheduler"); // 🔔 Initialize hearing notification scheduler

const app = express();
const server = http.createServer(app);

/* =======================
/* =======================
   SOCKET.IO CONFIG
======================= */
// ✅ DYNAMIC CORS: Fixes the Localhost -> Vercel cross-domain blocking for Video & Chat
const io = socketio(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://jurisbot.vercel.app"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true
  }
});

app.set("io", io);

/* =======================
   DATABASE
======================= */
connectDB();

/* =======================
   MIDDLEWARE
======================= */
const ALLOWED = (
  process.env.ALLOWED_ORIGINS || ""
).split(",")
  .map(o => o.trim())
  .filter(Boolean)

/* Always allow these in development */
const DEV_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175"
]

const ALL_ALLOWED = [
  ...new Set([...ALLOWED, ...DEV_ORIGINS])
]

app.use(cors({
  origin: function (origin, callback) {
    /* Allow requests with no origin
       (mobile apps, Postman, server calls) */
    if (!origin) {
      return callback(null, true)
    }
    if (ALL_ALLOWED.includes(origin)) {
      return callback(null, true)
    }
    /* In development allow everything */
    if (
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true)
    }
    console.warn(
      `[CORS] Blocked: ${origin}`
    )
    return callback(
      new Error(`Origin ${origin} blocked`),
      false
    )
  },
  credentials:    true,
  methods:        [
    "GET","POST","PUT",
    "PATCH","DELETE","OPTIONS"
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-auth-token"
  ]
}))

// 🛡️ SECURITY: HTTP Headers Protection
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:8088", "https://api.groq.com", "https://integrate.api.nvidia.com", "https://generativelanguage.googleapis.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// 🛡️ SECURITY: Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// 🛡️ SECURITY: DDoS & Brute Force Protection (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes."
});
app.use("/api", limiter);

/* Strict AI endpoint limiter */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "AI rate limit exceeded. " +
      "Max 20 AI requests per 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/* Auth brute force limiter */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many login attempts. " +
      "Try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const fs = require("fs");
const path = require("path");

app.use(express.json({
  limit: "10kb",
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
})); // Limit payload size against DDoS
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =======================
   SYSTEM INITIALIZATION
======================= */
const uploadsDir = path.join(__dirname, "uploads/documents");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Storage Infrastructure: Initialized at /uploads/documents");
}

/* =======================
   ROUTES
======================= */
app.use("/api/chat",        aiLimiter)
app.use("/api/cases/analyze-story", aiLimiter)
app.use("/api/auth/login",  authLimiter)
app.use("/api/auth/request-otp", authLimiter)
app.use("/api/auth/verify-otp",  authLimiter)

const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const lawyerRoutes = require("./routes/lawyers");
const caseRoutes = require("./routes/cases");
const appointmentRoutes = require("./routes/appointments");
const analyticsRoutes = require("./routes/analytics");
const adminRoutes = require("./routes/admin");
const notificationRoutes = require("./routes/notifications");
const documentRoutes = require("./routes/documents");

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/lawyers", lawyerRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/branding", require("./routes/branding"));

const paymentRoutes = require("./routes/payments");
app.use("/api/payments", paymentRoutes);
app.use("/api/webhooks", require("./routes/webhooks"));

// 🖼️ GLOBAL BRANDING ASSETS
app.use("/branding", express.static(path.join(__dirname, "public/branding")));

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File too large." });
  }
  if (err.message && err.message.includes("Invalid file type")) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

/* =======================
   SOCKET.IO LOGIC
======================= */
const Message = require("./models/Message"); // Moved to top-level

io.on("connection", (socket) => {
  console.log("Workspace Link Established:", socket.id);

  // ✅ TARGETED USER ROOM (For Private Notifications)
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  // ✅ SHARED CHAT/VIDEO ROOM (For consultations)
  socket.on("join-room", (room) => {
    socket.join(room);
    // Notify others in room to start peer handshake
    socket.to(room).emit("user-joined");
  });

  // ✅ REAL-TIME CHAT MESSAGING
  socket.on("send-message", async ({ to, message }) => {
    try {
      await Message.create({
        from: message.from,
        to: to,
        text: message.text
      });
      // Broadcast to specific recipient room
      io.to(to).emit("receive-message", message);
    } catch (err) {
      console.error("Socket Data Persistence Error:", err);
    }
  });

  // ✅ VIDEO CALL SIGNALING REINFORCEMENT
  socket.on("video-call-request", ({ to, from, fromName, roomId }) => {
    io.to(to).emit("incoming-video-call", { from, fromName, roomId });
  });

  socket.on("offer", (data) => {
    socket.to(data.room).emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.to(data.room).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.room).emit("ice-candidate", data);
  });

  socket.on("end-call", (room) => {
    socket.to(room).emit("end-call");
  });

  // ✅ SYSTEM-WIDE NOTIFICATIONS (FIXED)
  socket.on("notify", ({ to, text }) => {
    // Send as object to support {data.text} in frontend
    io.to(to).emit("notification", { text });
  });

  // ✅ MARKETPLACE BROADCAST (New Infrastucture)
  socket.on("update-marketplace", () => {
    io.emit("marketplace-needs-refresh");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from workspace:", socket.id);
  });
});

// ✅ EXPOSE SOCKET.IO TO ROUTES
app.set("io", io);

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 5000;

/* Export app and io for use in scheduler and other modules */
module.exports = { app, io, server };

server.listen(PORT, () => {
  console.log(`JurisBot Core: Unified Server Online on Port ${PORT}`);
});
