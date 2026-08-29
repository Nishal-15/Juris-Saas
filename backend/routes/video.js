const router = require("express").Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Lawyer = require("../models/Lawyer");

// POST /api/video/start
// Creates a Daily.co room and emits call-ready to both users
router.post("/start", auth(["lawyer"]), async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const lawyerId = req.user.id;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    // Ensure Daily API Key exists
    if (!process.env.DAILY_API_KEY) {
      return res.status(503).json({
        message: "Video call service not configured. Please add DAILY_API_KEY to backend/.env."
      });
    }

    // Fetch user details for notification context
    const lawyer = await Lawyer.findById(lawyerId).select("name");
    const citizen = await User.findById(targetUserId).select("name");

    if (!citizen || !lawyer) {
      return res.status(404).json({ message: "User or Lawyer not found." });
    }

    let roomUrl = null;

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
            enable_screenshare: false
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      roomUrl = dailyRes.data.url;
    } catch (dailyErr) {
      console.error("[Daily.co] Room creation failed:", dailyErr.message);
      return res.status(502).json({
        message: "Could not create video call room. Please try again in a moment."
      });
    }

    if (!roomUrl) {
      return res.status(502).json({ message: "Video call room URL not received." });
    }

    // Broadcast room URL to both parties via Socket.io
    const io = req.app.get("io");
    if (io) {
      // Ring the citizen
      io.to(targetUserId.toString()).emit("call-ready", {
        type: "daily",
        lawyerName: lawyer.name,
        callLink: roomUrl,
        message: `${lawyer.name} is calling you for an encrypted video consultation.`
      });
      // Ring the lawyer (they joined via lawyerId, so the socket room is their ID)
      // They initiated it, but this allows them to receive the link cleanly if needed, 
      // or the frontend can just use the HTTP response.
      io.to(lawyerId.toString()).emit("call-ready", {
        type: "daily",
        citizenName: citizen.name,
        callLink: roomUrl,
        message: "Virtual Courtroom created."
      });
    }

    res.json({
      success: true,
      callMethod: "daily",
      callLink: roomUrl,
      message: "Virtual Courtroom created successfully."
    });
  } catch (err) {
    console.error("Start Video Call Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
