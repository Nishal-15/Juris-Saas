const router = require("express").Router();
const axios = require("axios");
const auth = require("../middleware/auth");

const SYSTEM_PROMPT = `Your goal is to provide a COMPREHENSIVE, EASY-TO-READ legal guide to every query. 
STRICT FORMATTING:
**Punishment under Indian Law: [Topic]**
Under Section [Number] of the [Act], [Action] is punishable with [Punishment].
- Detail 1
- Detail 2

**DEFINITION: [Topic]**
What is [Topic]? In simple terms:
- Explanation 1

**IMPORTANT**
- Key factors/facts.

**FOLLOW UP**
- Bailable/Non-bailable nature.
- Punishment under the new law: BNS (Bharatiya Nyaya Sanhita).

RULES:
1. NO filenames or PDF names.
2. NO EMOJIS.
3. Answer in the requested language: {LANG}.`;

// 🧠 AI ENGINE (Proxied to Central Python Service)
router.post("/", auth(), async (req, res) => {
  const { message, lang = "en" } = req.body;
  const userId = req.user.id;

  try {
    console.log(`🤖 AI Query [Proxied]: ${message} (${lang})`);

    // 1. Get User Name for personalization
    const User = require("../models/User");
    const Lawyer = require("../models/Lawyer");
    let userName = "User";
    
    const dbUser = await User.findById(userId).select("name") || await Lawyer.findById(userId).select("name");
    if (dbUser) userName = dbUser.name;

    // 🧠 UNIVERSAL AI BRIDGE: Prioritize External Tunnel for Vercel, Fallback to Local
    const pythonAIServiceUrl = process.env.PYTHON_AI_SERVICE_URL || "http://127.0.0.1:8088/chat";
    console.log(`📡 Routing AI request to: ${pythonAIServiceUrl}`);
    
    try {
      const aiRes = await axios.post(pythonAIServiceUrl, {
        message,
        lang,
        userName
      });

      console.log("✅ AI Response received from Python Brain.");
      return res.json({ answer: aiRes.data.answer });

    } catch (pyErr) {
      console.error("❌ Python AI Service Down:", pyErr.message);
      return res.json({ 
        answer: "JurisBot is currently recalibrating its legal core. Please try again in a moment." 
      });
    }

  } catch (err) {
    console.error("❌ AI BRIDGE CRITICAL:", err.message);
    res.json({ 
      answer: "A communication error occurred within the JurisBot infrastructure." 
    });
  }
});

module.exports = router;