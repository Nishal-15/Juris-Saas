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

print(f"🔄 Initializing Pinecone index: {PINECONE_INDEX_NAME}...")
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(PINECONE_INDEX_NAME)

print(f"🔄 Loading Embedding Model: {MODEL_NAME}...")
model = SentenceTransformer(MODEL_NAME)

print("✅ AI Service Infrastructure: READY")

# =========================
# LLM GENERATOR
# =========================
SYSTEM_PROMPT = """
You are JurisBot, a High-Fidelity Indian Law AI Assistant.
Explain Indian laws clearly.
"""

def generate_answer(question, context):
    print(f"🤖 Consulting LLM ({LLM_MODEL})...")
    prompt = f"{SYSTEM_PROMPT}\n\nUser Question: {question}\n\nLegal Context: {context}"
    try:
        res = ollama.chat(model=LLM_MODEL, messages=[{"role":"user","content":prompt}])
        return res["message"]["content"]
    except Exception as e:
        return f"LLM Error: {str(e)}"

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
        
        print(f"👤 User says: {message} (Lang: {lang})")

        # 🚀 GREETING DETECTION
        greetings = ["hi", "hello", "hey", "namaste"]
        if any(g == message.lower().strip() for g in greetings):
            print("👋 Greeting detected. Sending instant reply.")
            return jsonify({"answer": "Hello! I am JurisBot, your AI Legal Assistant. How can I help you today?"})

        # 1. Translate Incoming
        print("🌍 Checking translation...")
        query_en = message
        if lang != "en":
            query_en = GoogleTranslator(source="auto", target="en").translate(message)

        # 2. Search Cloud Index
        print("🔍 Searching legal database (Pinecone)...")
        query_vec = model.encode([query_en])[0].tolist()
        results = index.query(vector=query_vec, top_k=2, include_metadata=True)

        if not results['matches']:
            print("⚠️ No matches found in database.")
            return jsonify({"answer": "I couldn't find a direct legal reference. Please try rephrasing."})

        context = "\n\n".join([m['metadata']['content'] for m in results['matches']])

        # 3. Generate LLM response
        print("🧠 Generating final legal answer...")
        final_answer = generate_answer(query_en, context)

        # 4. Translate back
        if lang != "en":
            print(f"🌍 Translating back to {lang}...")
            final_answer = GoogleTranslator(source="en", target=lang).translate(final_answer)

        print("✅ Success! Sending response.")
        return jsonify({"answer": final_answer})

    except Exception as e:
        print(f"❌ CRITICAL ERROR: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=8000)