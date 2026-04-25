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

// 🧠 AI ENGINE (Direct Gemini + Pinecone)
router.post("/", auth(), async (req, res) => {
  const { message, lang = "en" } = req.body;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  const PC_KEY = process.env.PINECONE_API_KEY;
  const PC_INDEX = process.env.PINECONE_INDEX_NAME || "jurisbot-index";

  try {
    console.log(`🤖 AI Query: ${message} (${lang})`);

    // 1 & 2. Get Embedding + Pinecone (RAG)
    let context = "";
    try {
      if (GEMINI_KEY && !GEMINI_KEY.includes("AIzaSyA_placeholder")) {
        console.log("🔍 Fetching Context...");
        const embedRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GEMINI_KEY}`,
          { model: "models/embedding-001", content: { parts: [{ text: message }] } }
        );
        const vector = embedRes.data.embedding.values;

        const pcRes = await axios.post(
          `https://${PC_INDEX}-emneh3v.svc.gcp-starter.pinecone.io/query`,
          { vector, topK: 1, includeMetadata: true },
          { headers: { "Api-Key": PC_KEY } }
        );

        if (pcRes.data.matches?.length > 0) {
          context = pcRes.data.matches[0].metadata.content;
          console.log("📖 Context Loaded.");
        }
      }
    } catch (ragErr) {
      console.warn("⚠️ RAG Bypassed (Key Invalid or Connection Error)");
    }

    // 3. Generate Answer (Groq - Llama 3.1)
    console.log("⚡ Generating Response with Groq...");
    const GROQ_KEY = process.env.GROQ_API_KEY;
    const prompt = `${SYSTEM_PROMPT.replace("{LANG}", lang)}\n\nContext: ${context}\n\nQuestion: ${message}`;
    
    if (GROQ_KEY) {
      console.log("🚀🚀🚀 [AI CORE] ACTIVATING GROQ (LLAMA 3.3) 🚀🚀🚀");
      try {
        const groqRes = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2
          },
          { headers: { Authorization: `Bearer ${GROQ_KEY}` } }
        );
        const answer = groqRes.data.choices[0].message.content;
        return res.json({ answer });
      } catch (groqErr) {
        console.error("Groq Fail, falling back to Gemini:", groqErr.message);
      }
    }

    // 4. Fallback to Local Mistral (Ollama) if Groq fails
    console.log("🔄 Groq failed or missing, falling back to Local Mistral...");
    try {
      const ollamaRes = await axios.post(
        "http://localhost:11434/api/generate",
        {
          model: "mistral",
          prompt: prompt,
          stream: false
        },
        { timeout: 300000 }
      );
      return res.json({ answer: ollamaRes.data.response });
    } catch (ollamaErr) {
      console.error("Local Mistral Fail:", ollamaErr.message);
      
      // Final Emergency Fallback to Gemini (only if local Mistral is also dead)
      const genRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] }
      );
      if (genRes.data.candidates && genRes.data.candidates[0].content) {
         return res.json({ answer: genRes.data.candidates[0].content.parts[0].text });
      }
      
      throw new Error("All AI Engines failed (Groq, Mistral, Gemini)");
    }

  } catch (err) {
    console.error("❌ AI CORE CRITICAL:", err.response?.data || err.message);
    const errorDetail = err.response?.data?.error?.message || err.message;
    res.json({ 
      answer: `JurisBot is currently reconnecting its legal core. (Error: ${errorDetail.substring(0, 50)}...). Please try once more.` 
    });
  }
});

module.exports = router;