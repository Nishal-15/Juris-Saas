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
# INIT
# =========================
app = Flask(__name__)
CORS(app)

print(f"🔄 Connecting to Pinecone: {PINECONE_INDEX_NAME}...")
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

print(f"🔄 Loading Embedding Model: {MODEL_NAME}...")
model = SentenceTransformer(MODEL_NAME)

print("✅ AI Service: FULL INFRASTRUCTURE READY")

# =========================
# LLM GENERATOR
# =========================
SYSTEM_PROMPT = """
You are JurisBot, a High-Fidelity Indian Law AI Assistant.
Explain Indian laws in a simple, clear way for citizens.
Mention you are an AI and not a substitute for professional legal advice.
Answer in the language requested: {LANG}.
Keep it concise and structured.
"""

def generate_answer(question, context, lang):
    print(f"🤖 AI Thinking (Mistral)...")
    prompt = f"{SYSTEM_PROMPT.replace('{LANG}', lang)}\n\nUser Question: {question}\n\nLegal Context: {context}"
    try:
        res = ollama.chat(model=LLM_MODEL, messages=[{"role":"user","content":prompt}])
        return res["message"]["content"]
    except Exception as e:
        print(f"❌ Mistral Error: {str(e)}")
        return f"I'm sorry, I encountered an issue with my AI core. Error: {str(e)}"

# =========================
# CHAT API
# =========================

@app.route("/chat", methods=["POST"])
def chat():
    print("\n📩 New Request Received!")
    try:
        data = request.get_json()
        message = data.get("message")
        lang = data.get("lang", "en")
        
        print(f"👤 User: {message} ({lang})")

        # 🚀 GREETING DETECTION (Instant Response)
        greetings = ["hi", "hello", "hey", "namaste"]
        if any(g == message.lower().strip() for g in greetings):
            print("👋 Sending instant greeting.")
            return jsonify({"answer": "Hello! I am JurisBot, your AI Legal Assistant. How can I help you today?"})

        # 1. Translate Incoming
        query_en = message
        if lang != "en":
            print("🌍 Translating query to English...")
            try:
                query_en = GoogleTranslator(source="auto", target="en").translate(message)
            except: pass

        # 2. Search Legal Database (Pinecone)
        print("🔍 Searching Legal Database...")
        query_vec = model.encode([query_en])[0].tolist()
        results = index.query(vector=query_vec, top_k=2, include_metadata=True)

        context = ""
        if results['matches']:
            context = "\n\n".join([m['metadata']['content'] for m in results['matches']])
            print(f"📖 Context Found ({len(results['matches'])} matches)")
        else:
            print("⚠️ No context found in database.")

        # 3. Generate Answer
        final_answer = generate_answer(query_en, context, lang)

        # 4. Translate back
        if lang != "en" and not final_answer.startswith("I'm sorry"):
            print(f"🌍 Translating response back to {lang}...")
            try:
                final_answer = GoogleTranslator(source="en", target=lang).translate(final_answer)
            except: pass

        print("✅ Response Sent!")
        return jsonify({"answer": final_answer})

    except Exception as e:
        print(f"❌ Server Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080)