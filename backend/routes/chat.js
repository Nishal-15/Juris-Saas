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
        { timeout: 30000 } // Increased timeout for heavy LLM tasks
      );

      // ✅ Check if Python returned an error
      if (response.data.error) {
        return res.json({ answer: `AI Service Error: ${response.data.error}` });
      }

      res.json(response.data);
    } catch (aiErr) {
      console.error("Mistral Service Connection Failed:", aiErr.message);
      res.json({ 
        answer: `Connection Error: Could not reach the AI Service at ${aiUrl}. Make sure app.py is running.` 
      });
    }
  } catch (err) {
    console.error("Chat Controller Error:", err.message);
    res.status(500).json({ error: "System encountered an error processing your request." });
  }
});

module.exports = router;