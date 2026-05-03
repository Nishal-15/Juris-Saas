import os
import requests
import random
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from agora_token_builder import RtcTokenBuilder

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
AGORA_APP_ID = os.getenv("AGORA_APP_ID", "c16823349942477382f6f595089e9095")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from Flutter

# BROAD SUBJECT FILTER (First line of defense)
REJECTED_CATEGORIES = [
    "game", "sports", "movie", "song", "food", "pizza", "weather", 
    "cricket", "hockey", "bollywood", "music", "dance", "football",
    "joke", "story", "recipe", "travel", "fashion", "gaming",
    "technology", "entertainment", "health", "education", "finance",
    "lifestyle", "science", "religion"
]

def handle_greeting(user_input, user_name="User"):
    greetings_trigger = ["hi", "hello", "hey", "good morning", "good evening"]
    responses = [
        f"Hello {user_name}! How can I assist you with legal information today?",
        f"Welcome {user_name}! I am your legal assistant. What can I help you with?",
        f"Greetings {user_name}! Ready to explore legal topics? Ask me anything about the law.",
        f"Hi {user_name}! I'm here to provide legal guidance. How can I help you today?",
        f"Good to see you {user_name}! How can I support your legal inquiries today?",
        f"Hello {user_name}! JurisBot is at your service. What legal questions do you have?",
        f"Welcome back {user_name}! How can I simplify the law for you today?"
    ]
    
    if user_input.lower().strip() in greetings_trigger:
        return random.choice(responses)
    return None

def get_legal_answer(user_input, lang="en"):
    # 1. Hard Filter for common non-legal topics
    if any(topic in user_input.lower() for topic in REJECTED_CATEGORIES):
        return "Sorry, I can't provide an answer for this. Please ask only law-related questions."

    # NEW: Detection for short notification/reminder prompts
    is_notification = any(x in user_input.lower() for x in ["reminder", "alert", "whatsapp", "1-sentence"])

    groq_err = "No error recorded"

    # 2. STRICT SYSTEM PROMPT
    if is_notification:
        system_instruction = "You are a professional Legal Expert. Write a short, professional 1-sentence legal notification for WhatsApp. Be concise."
    else:
        system_instruction = f"""
You are an advanced legal AI assistant specialized in Indian law — including IPC, BNS (Bharatiya Nyaya Sanhita 2023), CrPC, BNSS, Evidence Act, Constitution of India, and recent legal developments.

Your objective is to provide legally accurate, structured, practical, and non-generic answers.

DO NOT give vague or textbook-style responses. DO NOT start with "As an AI" or generic disclaimers.

For EVERY legal question, you MUST follow this exact response structure:

1. **Direct Answer**
   - Clear, decisive 1-2 line response to the user's query

2. **Relevant Law & Sections**
   - Cite the correct Act and sections (IPC/BNS/CrPC/BNSS/etc.)
   - State both old IPC section AND new BNS equivalent where applicable
   - NEVER confuse definition sections with punishment sections

3. **Punishment / Legal Outcome**
   - Specify: Jail term, Fine amount, Bailable or Non-bailable, Cognizable or Non-cognizable

4. **Key Legal Requirements / What Must Be Proven**
   - Required elements: intent, mens rea, actus reus, evidence type

5. **Practical Insight**
   - Real-world interpretation of how courts/police treat this
   - Common mistakes people make
   - How the system actually works on the ground

6. **Civil vs Criminal Angle** (if applicable)

7. **Simple Example** (if it helps clarify)

STRICT RULES:
- NEVER give wrong legal sections. If unsure, say: "This depends on facts, but generally..."
- Differentiate similar sections (e.g., IPC 417 vs 420, IPC 302 vs 304)
- Do NOT say "consult a lawyer" unless it is genuinely the only option
- Use plain English; explain jargon if you must use it
- Be precise, confident, and professional — like a senior advocate explaining to a client
- NO emojis. NO fluff. NO repetition. NO AI-sounding generic text.
- If the question is NOT related to law, reply ONLY: "Sorry, I can only answer law-related questions. Please ask about legal matters."

Answer in {lang}.
"""

    # 4. Groq Priority (Always First)
    if GROQ_API_KEY:
        try:
            print("Trying Groq...", flush=True)
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload = {
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_input}
                ],
                "temperature": 0.2,
                "max_tokens": 1500
            }
            res = requests.post(url, headers={"Authorization": f"Bearer {GROQ_API_KEY}"}, json=payload, timeout=10)
            data = res.json()
            if "choices" in data:
                return data["choices"][0]["message"]["content"]
            else:
                groq_err = f"Groq API Error: {data}"
                print(groq_err, flush=True)
        except Exception as e:
            groq_err = str(e)
            print(f"Groq error: {groq_err}", flush=True)

    # 5. Localhost Ollama Fallback (STRICTLY OPT-IN)
    if os.environ.get("USE_OLLAMA") == "true":
        try:
            print("Trying Local Mistral...", flush=True)
            payload = {"model": "mistral", "prompt": f"{system_instruction}\n\nQuery: {user_input}", "stream": False}
            res = requests.post(OLLAMA_URL, json=payload, timeout=15)
            if res.status_code == 200:
                return res.json().get("response")
        except Exception as e:
            print(f"Ollama error: {str(e)}", flush=True)
            return "JurisBot is having trouble connecting to Local Mistral. Please ensure Ollama is running."
    
    # If Groq failed, and we are not using Ollama, return the exact Groq error for debugging
    return f"JurisBot is having trouble connecting to its cloud brain. (Debug: {groq_err})"

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_input = data.get("message", "")
        lang = data.get("lang", "en")
        user_name = data.get("userName", "User")

        greeting = handle_greeting(user_input, user_name)
        if greeting: return jsonify({"answer": greeting})

        answer = get_legal_answer(user_input, lang)
        return jsonify({"answer": answer})

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}", flush=True)
        return jsonify({"error": "Internal AI server error"}), 500

@app.route("/generate-token", methods=["GET"])
def generate_token():
    channel_name = request.args.get("channel_name")
    uid = request.args.get("uid", 0, type=int)
    
    if not channel_name:
        return jsonify({"error": "channel_name is required"}), 400

    # Role: Publisher (1)
    role = 1
    expire_time_in_seconds = 3600
    current_timestamp = int(time.time())
    privilege_expired_ts = current_timestamp + expire_time_in_seconds

    # 🔥 GENERATE TOKEN
    try:
        token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID, 
            AGORA_APP_CERTIFICATE, 
            channel_name, 
            uid, 
            role, 
            privilege_expired_ts
        )
        return jsonify({
            "token": token,
            "channel": channel_name,
            "uid": uid
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8088)