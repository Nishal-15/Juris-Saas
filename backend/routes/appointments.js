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
        const lang = citizen.preferredLanguage || "en";
        sendAIWhatsApp(citizen.phone, citizen.name, activeCase?.title || "Legal Consultation", "booking_accepted", lang);
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
        return res.status(503).json({
          message:
            "Video call service not configured. " +
            "Please add DAILY_API_KEY to backend/.env. " +
            "Get a free key at daily.co"
        });
      }

      let roomUrl = null;
      let roomName = null;

      try {
        const dailyRes = await axios.post(
          "https://api.daily.co/v1/rooms",
          {
            properties: {
              exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
              enable_chat: true,
              start_audio_off: true,
              start_video_off: false,
              max_participants: 2,
              enable_screenshare: false,
              enable_recording: "none",
            }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
              "Content-Type": "application/json"
            }
          }
        );
        roomUrl  = dailyRes.data.url;
        roomName = dailyRes.data.name;
      } catch (dailyErr) {
        console.error(
          "[Daily.co] Room creation failed:",
          dailyErr.message
        );
        return res.status(502).json({
          message:
            "Could not create video call room. " +
            "Please try again in a moment."
        });
      }

      if (!roomUrl) {
        return res.status(502).json({
          message: "Video call room URL not received."
        });
      }

      const callLink = roomUrl;

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
