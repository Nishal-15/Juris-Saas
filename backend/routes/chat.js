const router = require("express").Router();
const axios = require("axios");
const auth = require("../middleware/auth");

// 🤖 MISTRAL AI CHAT (Secured)
router.post("/", auth(), async (req, res) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
    
    try {
      const response = await axios.post(
        `${aiUrl}/chat`,
        { ...req.body, lang: req.user.preferredLanguage || "en" },
        { timeout: 10000 } // Increased timeout for Mistral
      );
      res.json(response.data);
    } catch (aiErr) {
      console.error("Mistral Service Connection Failed:", aiErr.message);
      res.json({ 
        answer: "I'm sorry, I'm having trouble connecting to the legal database. Please ensure the AI service is active or consult a lawyer below." 
      });
    }
  } catch (err) {
    console.error("Chat Controller Error:", err.message);
    res.status(500).json({ error: "System encountered an error processing your request." });
  }
});

module.exports = router;