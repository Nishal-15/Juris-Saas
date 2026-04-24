from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from deep_translator import GoogleTranslator
from pinecone import Pinecone
from dotenv import load_dotenv
import os, re
import ollama

# Load environment from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

# =========================
# CONFIG (CLOUD MODE)
# =========================
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "jurisbot-index")
MODEL_NAME = "all-MiniLM-L6-v2"
LLM_MODEL = os.getenv("LLM_MODEL", "mistral")

# =========================
# INIT
# =========================
app = Flask(__name__)
CORS(app)

# Init Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

# Init Embedding Model
model = SentenceTransformer(MODEL_NAME)

# =========================
# LLM GENERATOR
# =========================
SYSTEM_PROMPT = """
You are JurisBot, a High-Fidelity Indian Law AI Assistant.
Your goal is to provide a COMPREHENSIVE and EASY-TO-READ legal guide for every query.

STRICT FORMATTING TEMPLATE (Follow this exactly for every response):

1. TITLE: **Punishment for [Offense Name] under Indian Law**

2. PUNISHMENT SECTION:
   Under [Section Number] of the [Act Name], [Offense] is punishable with:
   - [Punishment Detail 1]
   - [Punishment Detail 2]
   (If multiple sections apply, list them clearly).

3. DEFINITION SECTION:
   **What is "[Offense Name]"?**
   In simple terms, [Offense Name] generally means:
   - [Simple Bullet 1]
   - [Simple Bullet 2]

4. IMPORTANT POINTS:
   **Important point**
   [List 2-3 key factors or facts that determine the severity of the case].

5. FOLLOW-UP SUGGESTIONS:
   **If you want, I can also explain:**
   - Difference between [Topic] and [Topic]
   - Bailable or Non-bailable nature
   - Punishment under the new law, BNS (Bharatiya Nyaya Sanhita)

STRICT CONTENT RULES:
- NO SOURCES: NEVER mention filenames, .PDF extensions, or case names.
- NO LINKS: Do NOT add "Click to see sources".
- EMOJIS: Do NOT use emojis anymore, keep it professional and clean with bold headers.
- SPACING: Use double line breaks between sections.
"""

def generate_answer(question, context):
    prompt = f"{SYSTEM_PROMPT}\n\nUser Question: {question}\n\nLegal Context: {context}"
    try:
        res = ollama.chat(model=LLM_MODEL, messages=[{"role":"user","content":prompt}])
        return res["message"]["content"]
    except Exception as e:
        return f"I'm sorry, I'm having trouble connecting to my AI core. System Error: {str(e)}"

# =========================
# CHAT API
# =========================

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message")
        lang = data.get("lang", "en")

        if not message:
            return jsonify({"error": "No message provided"}), 400

        # 1. Translate Incoming
        query_en = message
        if lang != "en":
            try:
                query_en = GoogleTranslator(source="auto", target="en").translate(message)
            except: pass

        # 🚀 GREETING DETECTION
        greetings = ["hi", "hello", "hey", "namaste"]
        if any(g == query_en.lower().strip() for g in greetings):
            return jsonify({"answer": "Hello! I am JurisBot, your AI Legal Assistant. How can I help you today?"})

        # 2. Search Cloud Index (Pinecone)
        query_vec = model.encode([query_en])[0].tolist()
        
        results = index.query(
            vector=query_vec,
            top_k=3,
            include_metadata=True
        )

        if not results['matches']:
            return jsonify({"answer": "I couldn't find a direct legal reference for that. Please try rephrasing."})

        # Extract Context (Combine top matches for better coverage)
        context_parts = []
        for match in results['matches']:
            meta = match['metadata']
            # Clean context: remove technical headers to avoid LLM picking them up
            context_parts.append(meta['content'])
        
        context = "\n\n".join(context_parts)

        # 3. Generate LLM response
        final_answer = generate_answer(query_en, context)

        # 4. Translate back
        if lang != "en":
            try:
                final_answer = GoogleTranslator(source="en", target=lang).translate(final_answer)
            except: pass

        return jsonify({"answer": final_answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/brief", methods=["POST"])
def generate_brief():
    try:
        data = request.get_json()
        description = data.get("description")
        
        if not description:
            return jsonify({"error": "No description provided"}), 400

        prompt = f"Summarize the following legal matter into a professional case brief for a lawyer. Use three sections: Incident Summary, Legal Complexity, and Desired Outcome.\n\nDescription: {description}"
        
        res = ollama.chat(model=LLM_MODEL, messages=[{"role":"user","content":prompt}])
        brief = res["message"]["content"]

        return jsonify({"brief": brief})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=8000)