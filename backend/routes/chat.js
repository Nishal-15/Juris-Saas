const router = require("express").Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const auth = require("../middleware/auth");

// 🤖 INITIALIZE GEMINI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are JurisBot, a specialized Indian Legal Awareness AI. 
Explain Indian laws in a simple, clear way for citizens.
Mention you are an AI and not a substitute for professional legal advice.
Answer in the language requested: {LANG}.
Keep it concise and structured.
`;

// 🤖 CLOUD AI CHAT (Secured)
router.post("/", auth(), async (req, res) => {
  try {
    const { message } = req.body;
    const lang = req.user.preferredLanguage || "en";

    // 1. Check for API Key
    if (!process.env.GEMINI_API_KEY) {
      console.error("🔴 GEMINI_API_KEY is missing in Environment Variables!");
      return res.json({ 
        answer: "AI System Error: API Key not found. Please add GEMINI_API_KEY to Render settings." 
      });
    }

    // 2. Prepare Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Generate Content
    const prompt = `Context: ${SYSTEM_PROMPT.replace("{LANG}", lang)}\nUser Question: ${message}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
        throw new Error("Empty response from AI");
    }

    res.json({ answer: text });

  } catch (err) {
    console.error("🔴 Gemini AI Error:", err.message);
    
    // Provide a more helpful error for debugging
    let errorMsg = "I'm sorry, I encountered a technical issue while analyzing your legal query.";
    if (err.message.includes("API key not valid")) errorMsg = "AI Error: Invalid API Key. Please check your Gemini key.";
    if (err.message.includes("quota")) errorMsg = "AI Error: Rate limit reached. Please try again in 60 seconds.";

    res.json({ answer: errorMsg });
  }
});

module.exports = router;