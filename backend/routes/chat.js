const router = require("express").Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const Message = require("../models/Message");

// 📁 AGORA TOKEN GENERATION (Secure Mode)
router.get("/token", auth(), (req, res) => {
  const channelName = req.query.channelName;
  if (!channelName) return res.status(400).json({ error: "channelName is required" });

  const appId = process.env.AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;
  const uid = 0; 
  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );
    return res.json({ token, appId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 📁 FETCH CHAT HISTORY BETWEEN TWO USERS
router.get("/:id", auth(), async (req, res) => {
  try {
    const targetId = req.params.id;
    const myId = req.user.id;

    const messages = await Message.find({
      $or: [
        { from: myId, to: targetId },
        { from: targetId, to: myId }
      ]
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("❌ History Retrieval Failure:", err.message);
    res.status(500).json({ message: "Could not sync history." });
  }
});

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

    // 🧠 UNIVERSAL AI BRIDGE: Support both AI_SERVICE_URL and PYTHON_AI_SERVICE_URL
    const baseUrl = process.env.PYTHON_AI_SERVICE_URL || process.env.AI_SERVICE_URL || "http://127.0.0.1:8088/chat";
    const pythonAIServiceUrl = baseUrl.endsWith("/chat") ? baseUrl : `${baseUrl}/chat`;
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