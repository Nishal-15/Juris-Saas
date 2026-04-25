from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from deep_translator import GoogleTranslator
from pinecone import Pinecone
from dotenv import load_dotenv
import os, re
import ollama
import google.generativeai as genai

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

# =========================
# CONFIG
# =========================
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "jurisbot-index")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "all-MiniLM-L6-v2"
LLM_MODEL = os.getenv("LLM_MODEL", "mistral")

# =========================
# INIT (Robust Startup)
# =========================
app = Flask(__name__)
CORS(app)

print("🔄 Starting AI Service Lightning Mode...")

# Configure Gemini if key exists
if GEMINI_API_KEY:
    print("✨ Gemini API Key Found. Enabling Cloud Acceleration.")
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-pro')
else:
    print("⚠️ No Gemini Key found. Running in Local-Only mode.")

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
    prompt = f"{SYSTEM_PROMPT.replace('{LANG}', lang)}\n\nUser Question: {question}\n\nLegal Context: {context}"
    
    # 🚀 TRY GEMINI FIRST (Fast)
    if GEMINI_API_KEY:
        try:
            print("✨ AI Thinking (Gemini Cloud)...")
            response = gemini_model.generate_content(prompt)
            return response.text
        except Exception as ge:
            print(f"⚠️ Gemini Failed: {ge}. Falling back to Mistral...")

    # 🐢 FALLBACK TO MISTRAL (Local)
    print(f"🤖 AI Thinking (Mistral Local)...")
    try:
        res = ollama.chat(model=LLM_MODEL, messages=[{"role":"user","content":prompt}])
        return res["message"]["content"]
    except Exception as e:
        print(f"❌ LLM Error: {str(e)}")
        return "I'm sorry, I'm having trouble connecting to my AI core. Please check if your local AI service or internet is working."

# =========================
# CHAT API
# =========================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "alive", "port": 8080, "mode": "hybrid"})

@app.route("/chat", methods=["POST"])
def chat():
    print("\n📩 New Request Received!")
    try:
        data = request.get_json()
        message = data.get("message", "").strip()
        lang = data.get("lang", "en")
        
        if not message:
            return jsonify({"error": "Empty message"}), 400

        # 🚀 SMART GREETING DETECTION
        if re.match(r"^(hi|hello|hey|namaste|greetings|hi there|hello there)(\s|$|!|\.)", message.lower()):
            return jsonify({"answer": "Hello! I am JurisBot, your AI Legal Assistant. How can I help you today?"})

        # 1. Translate Incoming
        query_en = message
        if lang != "en":
            try:
                query_en = GoogleTranslator(source="auto", target="en").translate(message)
            except: pass

        # 2. Search Legal Database (Pinecone)
        context = ""
        try:
            query_vec = model.encode([query_en])[0].tolist()
            results = index.query(vector=query_vec, top_k=1, include_metadata=True)
            if results['matches']:
                context = results['matches'][0]['metadata']['content']
                print(f"📖 Context Found.")
        except Exception as pe:
            print(f"⚠️ Database Error: {pe}")
            context = "Note: Database offline. Using general knowledge."

        # 3. Generate Answer
        final_answer = generate_answer(query_en, context, lang)

        # 4. Translate back
        if lang != "en" and not final_answer.startswith("I'm sorry"):
            try:
                if len(final_answer) > 4500:
                    parts = [final_answer[i:i+4500] for i in range(0, len(final_answer), 4500)]
                    final_answer = "".join([GoogleTranslator(source="en", target=lang).translate(p) for p in parts])
                else:
                    final_answer = GoogleTranslator(source="en", target=lang).translate(final_answer)
            except: pass

        print("✅ Response Sent!")
        return jsonify({"answer": final_answer})

    except Exception as e:
        print(f"❌ CRITICAL CRASH: {str(e)}")
        return jsonify({"error": "Internal AI server error"}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080)