const router = require("express").Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const auth = require("../middleware/auth");

// 🤖 INITIALIZE GEMINI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are JurisBot, a specialized Indian Legal Awareness AI. 
Your goal is to explain Indian laws (IPC, BNS, CrPC, etc.) in a simple, clear way for citizens.

Rules:
1. Always mention that you are an AI assistant and not a substitute for professional legal advice.
2. If the user's question is about a specific case, advise them to consult one of the verified lawyers on our platform.
3. Keep responses structured with bullet points.
4. Keep it mobile-friendly: Use short paragraphs and bold text for key terms.
5. Answer in the language requested: {LANG}.
`;

// 🤖 CLOUD AI CHAT (Secured)
router.post("/", auth(), async (req, res) => {
  try {
    const { message } = req.body;
    const lang = req.user.preferredLanguage || "en";

    // 1. Check if API Key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ 
        answer: "System maintenance: Gemini API Key missing. Please contact administrator or use local mode." 
      });
    }

    // 2. Prepare Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Generate Content
    const prompt = `
    Context: ${SYSTEM_PROMPT.replace("{LANG}", lang)}
    User Question: ${message}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 4. Return formatted answer
    res.json({ answer: text });

  } catch (err) {
    console.error("Gemini AI Error:", err.message);
    res.status(500).json({ 
      answer: "I'm sorry, I'm having trouble connecting to my legal database right now. Please try again in a moment or connect with a lawyer below." 
    });
  }
});

module.exports = router;