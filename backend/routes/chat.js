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

// 🧠 PURE GROQ ENGINE
router.post("/", auth(), async (req, res) => {
  const { message, lang = "en" } = req.body;
  const GROQ_KEY = process.env.GROQ_API_KEY;

  try {
    console.log(`⚡ Groq Query: ${message} (${lang})`);

    if (!GROQ_KEY) {
      throw new Error("GROQ_API_KEY is missing in production environment.");
    }

    // Generate Answer (Groq - Llama 3.1)
    const prompt = `${SYSTEM_PROMPT.replace("{LANG}", lang)}\n\nQuestion: ${message}`;
    
    const groqRes = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      },
      { headers: { Authorization: `Bearer ${GROQ_KEY}` } }
    );

    const answer = groqRes.data.choices[0].message.content;
    res.json({ answer });

  } catch (err) {
    console.error("AI Core Error:", err.message);
    const errorMsg = err.response?.data?.error?.message || err.message;
    
    res.json({ 
      answer: `JurisBot is currently optimizing its legal core. (Internal Detail: ${errorMsg.substring(0, 50)}). Please check your internet or try again in 10 seconds.` 
    });
  }
});

module.exports = router;