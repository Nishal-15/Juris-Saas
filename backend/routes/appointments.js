const router = require("express").Router();
const axios = require("axios");
const Appointment = require("../models/Appointment");
const Case = require("../models/Case");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const { sendAIWhatsApp } = require("../utils/notifier");
const User = require("../models/User");

router.post("/", auth(), async (req, res) => {
  try {
    const openCase = await Case.findOne({ 
      user: req.user.id, 
      status: "Open" 
    }).sort({ createdAt: -1 });

    const appointment = await Appointment.create({
      userId: req.user.id,
      lawyerId: req.body.lawyerId,
      caseId: openCase ? openCase._id : null, 
      date: req.body.date,
      time: req.body.time,
      status: req.body.status || "Pending"
    });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/my", auth(), async (req, res) => {
  try {
    const apps = await Appointment.find({ userId: req.user.id })
      .populate("lawyerId", "name email");
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/received", auth(["lawyer"]), async (req, res) => {
  try {
    const apps = await Appointment.find({ lawyerId: req.user.id })
      .populate("userId", "name")
      .populate("caseId");
    res.json(apps);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id/status", auth(["lawyer"]), async (req, res) => {
  try {
    const { status } = req.body;
    const app = await Appointment.findOneAndUpdate(
      { _id: req.params.id, lawyerId: req.user.id },
      { status },
      { new: true }
    );
    if (!app) return res.status(404).json({ message: "Appointment not found" });

    // 🔬 PERSISTENCE: Save into User's Notification History
    await Notification.create({
       user: app.userId,
       title: "Consultation Update",
       message: `Expert Adv. ${status === "Accepted" ? "✅ Accepted" : "❌ Returned"} your consultation request!`,
       icon: status === "Accepted" ? "⚖️" : "🚨"
    });

    // 🔬 BROADCAST: Targeted Notification for the Citizen
    const io = req.app.get("io");
    if (io && app.userId) {
       io.to(app.userId.toString()).emit("notification", {
          text: `Expert Adv. ${status === "Accepted" ? "✅ Accepted" : "❌ Returned"} your consultation request!`
       });
    }

    // 📱 WHATSAPP: Send AI alert if accepted
    if (status === "Accepted") {
      const citizen = await User.findById(app.userId);
      const activeCase = app.caseId ? await Case.findById(app.caseId) : null;
      if (citizen && citizen.phone) {
        sendAIWhatsApp(citizen.phone, citizen.name, activeCase?.title || "Legal Consultation", "booking_accepted");
      }
    }

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  "/:id/start-call",
  auth(["lawyer"]),
  async (req, res) => {
    try {
      const appointment =
        await Appointment.findById(
          req.params.id
        )
        .populate("userId", "name phone")
        .populate("lawyerId", "name phone")

      if (!appointment) {
        return res.status(404).json({
          message: "Appointment not found"
        })
      }

      const citizen = appointment.userId;
      const lawyer  = appointment.lawyerId;

      // Ensure Daily API Key exists
      if (!process.env.DAILY_API_KEY) {
        return res.status(500).json({ message: "Daily API Key not configured." });
      }

      // Create a secure Daily.co room
      const dailyRes = await axios.post(
        "https://api.daily.co/v1/rooms",
        {
          properties: {
            exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
            enable_chat: true,
            start_audio_off: true,
            start_video_off: false,
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const callLink = dailyRes.data.url;

      // Broadcast room URL to both parties via Socket.io
      const io = req.app.get("io");
      if (io) {
        if (citizen?._id) {
          io.to(citizen._id.toString()).emit("call-ready", {
            type: "daily",
            lawyerName: lawyer.name,
            callLink,
            message: `${lawyer.name} is ready. The Virtual Courtroom is open.`
          });
        }
        if (lawyer?._id) {
          io.to(lawyer._id.toString()).emit("call-ready", {
            type: "daily",
            citizenName: citizen?.name,
            callLink,
            message: "Virtual Courtroom created and sent to citizen."
          });
        }
      }

      res.json({
        success: true,
        callMethod: "daily",
        callLink,
        message: "Virtual Courtroom created successfully."
      });
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

module.exports = router;
