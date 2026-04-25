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

    // 1. Get Embedding
    let context = "";
    try {
      const embedRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GEMINI_KEY}`,
        { model: "models/embedding-001", content: { parts: [{ text: message }] } }
      );
      const vector = embedRes.data.embedding.values;

      // 2. Query Pinecone (REST API)
      const pcRes = await axios.post(
        `https://${PC_INDEX}-emneh3v.svc.gcp-starter.pinecone.io/query`,
        { vector, topK: 1, includeMetadata: true },
        { headers: { "Api-Key": PC_KEY } }
      );

      if (pcRes.data.matches?.length > 0) {
        context = pcRes.data.matches[0].metadata.content;
      }
    } catch (ragErr) {
      console.error("RAG Error:", ragErr.message);
    }

    // 3. Generate Answer
    const prompt = `${SYSTEM_PROMPT.replace("{LANG}", lang)}\n\nContext: ${context}\n\nQuestion: ${message}`;
    const genRes = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    const answer = genRes.data.candidates[0].content.parts[0].text;
    res.json({ answer });

  } catch (err) {
    console.error("AI Core Error:", err.message);
    res.json({ 
      answer: "I'm sorry, I encountered a connection error with my legal core. Please verify your internet connection or try again in a few moments." 
    });
  }
});

module.exports = router;