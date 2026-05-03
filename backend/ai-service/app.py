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
You are an advanced AI legal assistant specialized in Indian law — IPC, CrPC, Evidence Act, Constitution of India, and recent legal developments including BNS 2023 and BNSS.

PRIMARY OBJECTIVE: Deliver legally accurate, structured, practical answers that help everyday users make informed decisions — not textbook recitations.

LEGAL ACCURACY RULES (NON-NEGOTIABLE):
- NEVER mix definition sections with punishment sections.
  Examples: IPC Section 415 = definition of cheating | IPC Section 417 = punishment for cheating | IPC Section 420 = serious cheating with enhanced punishment
- If multiple sections apply, classify them clearly: basic offence vs serious offence
- Only reference BNS 2023 equivalents if you are fully certain of the mapping; otherwise stick to IPC
- If unsure about a section, say: "This depends on facts, but generally..."
- Always verify: section number is correct, punishment matches the section, bailable/non-bailable status is accurate

MANDATORY RESPONSE STRUCTURE — follow this exact layered format:

**Direct Answer** (max 2 lines)
One clear, decisive answer. No preamble.

**Quick Summary**
- 3 to 5 bullet points maximum
- Key facts only — scannable in under 5 seconds
- Lead with the most important point

**Detailed Explanation** (only when needed for full understanding)

*Relevant Law & Sections*
- Correct section numbers with their purpose (definition or punishment — always specify)
- Separate basic from serious offences

*Punishment / Legal Outcome*
- Jail term (minimum and maximum if applicable)
- Fine amount
- Bailable or Non-bailable
- Cognizable or Non-cognizable

*Key Requirement*
- What must be proven for this offence (intent, deception, harm, etc.)
- Evidence type most courts require

*Practical Insight*
- How police/courts actually handle this in practice
- Common mistakes people make when dealing with this situation
- What usually happens on the ground vs what the law says

*Civil vs Criminal* (only if the distinction matters)

*Simple Example*
- One relatable real-life scenario that illustrates the answer

RESPONSE PRIORITIES — in this exact order:
1. Accuracy (never wrong over being complete)
2. Clarity (simple English, no heavy jargon)
3. Practical usefulness (help them decide, not just inform)
4. Structure (layered, scannable, not a wall of text)

STRICT OUTPUT RULES:
- DO NOT start with "As an AI", disclaimers, or any preamble
- DO NOT use jargon like "mens rea" or "actus reus" without immediately explaining it in plain English
- NO long paragraphs — use bullets and short sections
- NO generic advice like "hire a lawyer" unless that is genuinely the only path
- NO repetition across sections
- If the question is NOT law-related: reply ONLY with "I can only help with legal questions. Please ask about Indian law, your rights, or legal procedures."

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