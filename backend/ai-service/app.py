from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from deep_translator import GoogleTranslator
from pinecone import Pinecone
from dotenv import load_dotenv
import os, re
import ollama

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

# =========================
# CONFIG
# =========================
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "jurisbot-index")
MODEL_NAME = "all-MiniLM-L6-v2"
LLM_MODEL = os.getenv("LLM_MODEL", "mistral")

# =========================
# INIT (Robust Startup)
# =========================
app = Flask(__name__)
CORS(app)

print("🔄 Starting AI Service Overhaul...")

try:
    print(f"🔄 Connecting to Pinecone: {PINECONE_INDEX_NAME}...")
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    
    print(f"🔄 Loading Embedding Model: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    print("✅ Infrastructure: READY")
except Exception as e:
    print(f"⚠️ Startup Warning: {str(e)}")
    print("AI will attempt to run in fallback mode.")

# =========================
# LLM GENERATOR
# =========================
SYSTEM_PROMPT = """
Your goal is to provide a COMPREHENSIVE, EASY-TO-READ legal guide to every query. 
STRICT FORMATTING TEMPLATE - Follow this structure exactly:

**Punishment under Indian Law: [Topic]**
Under Section [Number] of the [Act], [Action] is punishable with [Punishment].
- Punishment Detail 1
- Punishment Detail 2
(If multiple sections apply, describe them clearly).

**DEFINITION: [Topic]**
What is [Topic]? In simple terms:
- Simple Explanation Bullet 1
- Simple Explanation Bullet 2

**IMPORTANT**
- Important point for the citizen.
- List key factors/facts that determine the severity of the case.

**FOLLOW UP**
- If you [Condition], then [Action].
- Difference between [Topic A] and [Topic B].
- Bailable/Non-bailable nature.
- Punishment under the new law: BNS (Bharatiya Nyaya Sanhita).

STRICT CONTENT RULES:
1. NO filenames. NEVER mention filenames, PDF extensions, or case names.
2. NO EMOJIS. Do NOT use emojis. Keep the tone formal.
3. Answer in the requested language: {LANG}.
"""

def generate_answer(question, context, lang):
    print(f"🤖 AI Thinking (Mistral)...")
    prompt = f"{SYSTEM_PROMPT.replace('{LANG}', lang)}\n\nUser Question: {question}\n\nLegal Context: {context}"
    try:
        # Check if ollama is reachable and model is pulled
        res = ollama.chat(model=LLM_MODEL, messages=[{"role":"user","content":prompt}])
        return res["message"]["content"]
    except Exception as e:
        print(f"❌ LLM Error: {str(e)}")
        return f"I'm sorry, I couldn't generate a response using the local model. Please ensure Ollama is running and '{LLM_MODEL}' is pulled."

# =========================
# CHAT API
# =========================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "alive", "port": 8080})

@app.route("/chat", methods=["POST"])
def chat():
    print("\n📩 New Request Received!")
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400
            
        message = data.get("message", "").strip()
        lang = data.get("lang", "en")
        
        if not message:
            return jsonify({"error": "Empty message"}), 400

        print(f"👤 User: {message} ({lang})")

        # 🚀 SMART GREETING DETECTION (Regex)
        if re.match(r"^(hi|hello|hey|namaste|greetings|hi there|hello there)(\s|$|!|\.)", message.lower()):
            print("👋 Instant greeting sent.")
            return jsonify({"answer": "Hello! I am JurisBot, your AI Legal Assistant. How can I help you today?"})

        # 1. Translate Incoming
        query_en = message
        if lang != "en":
            try:
                print("🌍 Translating query...")
                query_en = GoogleTranslator(source="auto", target="en").translate(message)
            except Exception as te:
                print(f"⚠️ Translation Error: {te}")

        # 2. Search Legal Database (Pinecone)
        context = ""
        try:
            print("🔍 Searching Legal Database...")
            query_vec = model.encode([query_en])[0].tolist()
            results = index.query(vector=query_vec, top_k=1, include_metadata=True)
            if results['matches']:
                context = "\n\n".join([m['metadata']['content'] for m in results['matches']])
                print(f"📖 Context Found.")
        except Exception as pe:
            print(f"⚠️ Database Error: {pe}")
            context = "Note: Legal database search unavailable. Providing general information."

        # 3. Generate Answer
        final_answer = generate_answer(query_en, context, lang)

        # 4. Translate back (Safely)
        if lang != "en" and not final_answer.startswith("I'm sorry"):
            try:
                print(f"🌍 Translating response back to {lang}...")
                # Split translation into smaller chunks if it's too long (over 4500 chars)
                if len(final_answer) > 4500:
                    parts = [final_answer[i:i+4500] for i in range(0, len(final_answer), 4500)]
                    translated_parts = [GoogleTranslator(source="en", target=lang).translate(p) for p in parts]
                    final_answer = "".join(translated_parts)
                else:
                    final_answer = GoogleTranslator(source="en", target=lang).translate(final_answer)
            except Exception as te:
                print(f"⚠️ Final Translation Error: {te}")

        print("✅ Response Sent!")
        return jsonify({"answer": final_answer})

    except Exception as e:
        print(f"❌ CRITICAL CRASH: {str(e)}")
        return jsonify({"error": "Internal AI server error"}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080)