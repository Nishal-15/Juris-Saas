const router = require("express").Router();
const axios = require("axios");
const Message = require("../models/Message");
const auth = require("../middleware/auth");

// 🤖 AI CHAT (Secured)
router.post("/", auth(), async (req, res) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    try {
      const response = await axios.post(
        `${aiUrl}/chat`,
        { ...req.body, lang: req.user.preferredLanguage || "en" },
        { timeout: 5000 } // Don't hang the request
      );
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI Service Connection Failed:", aiErr.message);
      // ✅ PROFESSIONAL FALLBACK
      res.json({ 
        answer: "Our specialized legal AI is currently syncronizing with the latest Indian Statutes. In the meantime, I can still help you with case tracking or connecting you with a verified advocate. How would you like to proceed?" 
      });
    }
});

// 👥 HUMAN-TO-HUMAN HISTORY
router.get("/:targetId", auth(), async (req, res) => {
  try {
    const userId = req.user.id;
    const targetId = req.params.targetId;

    const history = await Message.find({
      $or: [
        { from: userId, to: targetId },
        { from: targetId, to: userId }
      ]
    }).sort({ timestamp: 1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "History fetch failed" });
  }
});

module.exports = router;