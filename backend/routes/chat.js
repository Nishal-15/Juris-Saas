const router = require("express").Router();
const axios = require("axios");
const auth = require("../middleware/auth");

// 🤖 MISTRAL AI CHAT (Secured)
router.post("/", auth(), async (req, res) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8080";
    console.log(`📡 AI Bridge: Sending request to ${aiUrl}/chat...`);
    
    try {
      const response = await axios.post(
        `${aiUrl}/chat`,
        { ...req.body, lang: req.user.preferredLanguage || "en" },
        { 
          timeout: 300000, // 👈 5 Minutes (Mistral on CPU is slow)
          family: 4
        }
      );

      // ✅ Check if Python returned an error
      if (response.data.error) {
        return res.json({ answer: `AI Service Error: ${response.data.error}` });
      }

      res.json(response.data);
    } catch (aiErr) {
      console.error("Mistral Service Error:", aiErr.message);
      
      // ✅ If the server responded with an error (e.g. 500)
      if (aiErr.response) {
        return res.json({ 
          answer: `AI Service Crashed: The Python service is running but returned an error: ${JSON.stringify(aiErr.response.data)}` 
        });
      }

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