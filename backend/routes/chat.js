const router = require("express").Router();
const axios = require("axios");
const auth = require("../middleware/auth");

// 🤖 MISTRAL AI CHAT (Secured)
router.post("/", auth(), async (req, res) => {
  try {
    const aiUrl = process.env.AI_SERVICE_URL || "http://127.0.0.1:8080";
    console.log(`📡 AI Bridge: Sending request to ${aiUrl}/chat...`);
    
    const userLang = (req.user.preferredLanguage || "en").split('-')[0].toLowerCase();
    
    try {
      const response = await axios.post(
        `${aiUrl}/chat`,
        { ...req.body, lang: userLang },
        { 
          timeout: 600000, // 👈 10 Minutes (Mistral on CPU is very slow)
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
        const errorData = aiErr.response.data;
        let errorMessage = "Internal AI Processing Error";
        
        if (typeof errorData === 'string') {
          // If it's HTML, take the title or first bit
          errorMessage = errorData.includes("<title>") 
            ? errorData.split("<title>")[1].split("</title>")[0]
            : "AI Service Unavailable (502/503 Proxy Error)";
        } else {
          errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
        }

        return res.json({ 
          answer: `AI Service Error: ${errorMessage}` 
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