require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const socketio = require("socket.io");

const connectDB = require("./config/db");
require("./utils/scheduler"); // 🔔 Initialize hearing notification scheduler

const app = express();
const server = http.createServer(app);

/* =======================
   SOCKET.IO CONFIG
======================= */
const origins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim()) 
  : [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174"
    ];

const io = socketio(server, {
  cors: {
    origin: origins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

/* =======================
   DATABASE
======================= */
connectDB();

/* =======================
   MIDDLEWARE
======================= */
app.use(cors({
  origin: origins,
  credentials: true
}));

const fs = require("fs");
const path = require("path");

app.use(express.json());
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

/* =======================
   SOCKET.IO LOGIC
======================= */
const Message = require("./models/Message"); // Moved to top-level

io.on("connection", (socket) => {
  console.log("Workspace Link Established:", socket.id);

  // ✅ TARGETED USER ROOM (For Private Notifications)
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private notification secure-room`);
  });

  // ✅ SHARED CHAT/VIDEO ROOM (For consultations)
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined shared workspace: ${room}`);
    // Notify others in room to start peer handshake
    socket.to(room).emit("user-joined");
  });

  // ✅ REAL-TIME CHAT MESSAGING
  socket.on("send-message", async ({ to, message }) => {
    console.log(`Processing message from ${message.from} to ${to}`);
    try {
      await Message.create({
        from: message.from,
        to: to,
        text: message.text
      });
      // Broadcast to specific recipient room
      io.to(to).emit("receive-message", message);
      console.log(`Message delivered to target: ${to}`);
    } catch (err) {
      console.error("Socket Data Persistence Error:", err);
    }
  });

  // ✅ VIDEO CALL SIGNALING REINFORCEMENT
  socket.on("video-call-request", ({ to, from, fromName, roomId }) => {
    console.log(`Video-call request for ${to} from ${fromName}`);
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

server.listen(PORT, () => {
  console.log(`JurisBot Core: Unified Server Online on Port ${PORT}`);
});
