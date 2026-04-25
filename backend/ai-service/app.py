from flask import Flask, request, jsonify
from flask_cors import CORS
from deep_translator import GoogleTranslator
from pinecone import Pinecone
from dotenv import load_dotenv
import os, re, requests
import ollama

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

# =========================
# CONFIG
# =========================
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "jurisbot-index")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "mistral")

# =========================
# INIT (Ultra Stable v4.0)
# =========================
app = Flask(__name__)
CORS(app)

print("🔄 Starting AI Service [VERSION 4.0 - DIRECT CONNECT]...")

# Connect to Pinecone
try:
    print(f"🔄 Connecting to Pinecone: {PINECONE_INDEX_NAME}...")
    pc = Pinecone(api_key=PINECONE_API_KEY)
    index = pc.Index(PINECONE_INDEX_NAME)
    print("✅ Database: READY")
except Exception as e:
    print(f"⚠️ Pinecone Warning: {str(e)}")

# =========================
# DIRECT API HELPERS
# =========================

def get_embedding_direct(text):
    """Direct HTTP call to Gemini Embedding API"""
    if not GEMINI_API_KEY: return None
    url = f"https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key={GEMINI_API_KEY}"
    payload = {
        "model": "models/embedding-001",
        "content": {"parts": [{"text": text}]}
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        res_json = response.json()
        if response.status_code != 200:
            print(f"❌ Gemini Embed Error ({response.status_code}): {res_json}")
            return None
        return res_json['embedding']['values']
    except Exception as e:
        print(f"❌ Direct Embedding Exception: {e}")
        return None

def generate_answer_direct(prompt):
    """Direct HTTP call to Gemini GenerateContent API"""
    if not GEMINI_API_KEY: return None
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    try:
        response = requests.post(url, json=payload, timeout=60)
        res_json = response.json()
        if response.status_code != 200:
            print(f"❌ Gemini Chat Error ({response.status_code}): {res_json}")
            return None
        return res_json['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        print(f"❌ Direct Gemini Exception: {e}")
        return None

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
    
    # 1. TRY DIRECT CLOUD FIRST
    print("✨ AI Thinking (Gemini Cloud Direct)...")
    answer = generate_answer_direct(prompt)
    if answer: return answer

    # 2. FALLBACK TO MISTRAL
    print("🤖 AI Thinking (Mistral Fallback)...")
    try:
        res = ollama.chat(model=LLM_MODEL, messages=[{"role":"user","content":prompt}])
        return res["message"]["content"]
    except Exception as e:
        print(f"❌ AI Error: {e}")
        return "I'm sorry, I'm having trouble connecting to my AI core."

# =========================
# CHAT API
# =========================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "alive", "version": "4.0"})

@app.route("/chat", methods=["POST"])
def chat():
    print("\n📩 New Request Received!")
    try:
        data = request.get_json()
        message = data.get("message", "").strip()
        lang = data.get("lang", "en")
        
        if not message:
            return jsonify({"error": "Empty message"}), 400

        # 🚀 GREETING DETECTION
        if re.match(r"^(hi|hello|hey|namaste|greetings|hi there|hello there)(\s|$|!|\.)", message.lower()):
            return jsonify({"answer": "Hello! I am JurisBot, your AI Legal Assistant. How can I help you today?"})

        # 1. Translate Incoming
        query_en = message
        if lang != "en":
            try:
                query_en = GoogleTranslator(source="auto", target="en").translate(message)
            except: pass

        # 2. Search Database
        context = ""
        try:
            query_vec = get_embedding_direct(query_en)
            if query_vec:
                results = index.query(vector=query_vec, top_k=1, include_metadata=True)
                if results['matches']:
                    context = results['matches'][0]['metadata']['content']
                    print(f"📖 Context Found.")
        except Exception as pe:
            print(f"⚠️ Database Error: {pe}")

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
        print(f"❌ CRITICAL ERROR: {str(e)}")
        return jsonify({"error": "Internal AI server error"}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080)