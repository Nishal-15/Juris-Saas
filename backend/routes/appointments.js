const router = require("express").Router();
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

module.exports = router;
