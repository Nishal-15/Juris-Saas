const router = require("express").Router();
const axios = require("axios");
const auth = require("../middleware/auth");
const { getAIChatURL } = require("../utils/aiUrl");


const Message = require("../models/Message");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📁 UPLOAD CONFIG FOR CHAT ATTACHMENTS
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/chat");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `CHAT_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB Limit

// 📁 UPLOAD CHAT ATTACHMENT
router.post("/upload", auth(), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const fileUrl = `uploads/chat/${req.file.filename}`;
    res.json({ fileUrl, fileName: req.file.originalname });
  } catch (err) {
    console.error("Chat Upload Error:", err);
    res.status(500).json({ message: "Failed to upload file." });
  }
});
// 📁 FETCH ACTIVE CHAT CONTACTS
router.get("/contacts", auth(), async (req, res) => {
  try {
    const myId = req.user.id;
    const messages = await Message.find({
      $or: [{ from: myId }, { to: myId }]
    }).sort({ createdAt: -1 });

    const contactIds = new Set();
    messages.forEach(m => {
      if (m.from && m.from.toString() !== myId) contactIds.add(m.from.toString());
      if (m.to && m.to.toString() !== myId) contactIds.add(m.to.toString());
    });

    const User = require("../models/User");
    const Lawyer = require("../models/Lawyer");

    /* Bulk-fetch all contacts in 2 queries instead of N queries */
    const idArray = Array.from(contactIds);
    const [users, lawyers] = await Promise.all([
      User.find({ _id: { $in: idArray } }).select("name email phone"),
      Lawyer.find({ _id: { $in: idArray } }).select("name email phone specialization")
    ]);

    const allContacts = [...users, ...lawyers];
    const contacts = allContacts.map(u => ({
      userId: u,
      date: "Direct Message",
      time: "Active"
    }));

    res.json(contacts);
  } catch (err) {
    console.error("❌ Contacts Retrieval Failure:", err.message);
    res.status(500).json({ message: "Could not fetch chat contacts." });
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

  /* Validate message length */
  if (!message || typeof message !== "string") {
    return res.status(400).json({
      message: "Message is required."
    });
  }
  if (message.trim().length === 0) {
    return res.status(400).json({
      message: "Message cannot be empty."
    });
  }
  if (message.length > 2000) {
    return res.status(400).json({
      message:
        "Message too long. " +
        "Maximum 2000 characters."
    });
  }

  try {
    console.log(`🤖 AI Query [Proxied]: ${message} (${lang})`);

    // 1. Get User Name for personalization
    const User = require("../models/User");
    const Lawyer = require("../models/Lawyer");
    let userName = "User";
    
    const dbUser = await User.findById(userId).select("name") || await Lawyer.findById(userId).select("name");
    if (dbUser) userName = dbUser.name;

    const pythonAIServiceUrl = getAIChatURL();
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