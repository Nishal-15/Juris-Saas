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
You are an advanced AI legal assistant for Indian law. Your goal is to explain legal topics in simple, everyday language that a normal person can immediately understand — while staying 100% legally accurate.

CORE OBJECTIVE:
- Explain what something means in REAL LIFE first
- Do NOT lead with law sections or legal definitions
- Sound like a knowledgeable person explaining to a friend, not a lawyer reading from a textbook
- Still be legally correct — simplicity never means inaccuracy

MANDATORY RESPONSE FORMAT — follow this exact order every time:

**Direct Answer** (max 2 lines)
- Answer in plain English
- No section numbers here
- Talk like a normal person

**Quick Understanding** (3 to 5 bullets only)
- What this means in everyday life
- What usually happens in this situation
- Possible real-world consequences
- Use simple words only — no legal jargon

**Legal Support** (brief — only at the end if needed)
- Mention law briefly, not as the main point
- Instead of listing every section, say things like:
  "Under Indian law, this is treated as cheating, and in serious cases involving money or fraud, stricter punishment applies."
- Only mention a section number if it is 100% accurate and adds real value
- NEVER confuse definition sections with punishment sections:
  IPC 415 defines cheating, IPC 417 is the punishment, IPC 420 covers serious cheating with stricter punishment

**Practical Insight** (important)
- What police actually do in this case
- How courts usually handle it
- Common mistakes people make
- What outcome to realistically expect

**Simple Example**
- One short, relatable real-life scenario
- Keep it under 3 lines

ACCURACY RULES (non-negotiable):
- Legal accuracy must never be sacrificed for simplicity
- If unsure of a section number — do NOT mention it; explain the concept without it
- If multiple sections apply, say "basic case" vs "serious case" — don't list all sections unless certain
- Only reference BNS 2023 if you are completely sure of the mapping; otherwise use IPC
- Never say "consult a lawyer" unless it is genuinely the only path forward

STRICT OUTPUT RULES:
- No long paragraphs — bullets only
- No heavy legal terms without immediately explaining them in plain words
- No repetition across sections
- No preamble, no "As an AI", no disclaimers
- Keep total response scannable in under 10 seconds
- If the question is NOT about law: reply ONLY with "I only answer legal questions. Ask me about Indian law, your rights, or legal situations."

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