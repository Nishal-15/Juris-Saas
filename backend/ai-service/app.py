import os
import requests
import random
from flask import Flask, request, jsonify
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

app = Flask(__name__)

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

    # 2. STRICT SYSTEM PROMPT (The "2nd Image" Format + Logic)
    system_instruction = f"""
    You are a professional Legal Expert. 
    
    RULE 1: If the user's query is NOT strictly related to law, legal procedures, or Indian Law, you MUST reply ONLY with: 
    "Sorry, I can't provide an answer for this. Please ask only law-related questions."
    
    RULE 2: If the query IS legal, you MUST follow this EXACT format:
    
    **Punishment under Indian Law: [Topic]**
    [Direct answer with Section/Act and punishment details]
    - Detail 1
    - Detail 2
    
    **DEFINITION: [Topic]**
    [Simple, easy-to-understand definition]
    - Detail 1
    - Detail 2
    
    **IMPORTANT**
    - Key fact 1
    - Key fact 2
    
    **FOLLOW UP**
    - Bailable/Non-bailable status
    - Advice or BNS (Bharatiya Nyaya Sanhita) context
    
    Answer in {lang}. NO EMOJIS. NO LONG PARAGRAPHS.
    """

    # 3. Gemini Attempt
    if GEMINI_API_KEY:
        try:
            print("Trying Gemini...", flush=True)
            url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
            payload = {"contents": [{"parts": [{"text": f"{system_instruction}\n\nQuery: {user_input}"}]}]}
            res = requests.post(url, json=payload, timeout=10)
            data = res.json()
            if "candidates" in data:
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Gemini error: {str(e)}", flush=True)

    # 4. Groq Fallback
    if GROQ_API_KEY:
        try:
            print("Trying Groq...", flush=True)
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_input}
                ]
            }
            res = requests.post(url, headers={"Authorization": f"Bearer {GROQ_API_KEY}"}, json=payload, timeout=10)
            data = res.json()
            if "choices" in data:
                return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"Groq error: {str(e)}", flush=True)

    # 5. Ollama Fallback
    try:
        print("Trying Local Mistral...", flush=True)
        payload = {"model": "mistral", "prompt": f"{system_instruction}\n\nQuery: {user_input}", "stream": False}
        res = requests.post(OLLAMA_URL, json=payload, timeout=15)
        if res.status_code == 200:
            return res.json().get("response")
    except Exception as e:
        print(f"Ollama error: {str(e)}", flush=True)

    return "I am having trouble connecting to my legal brains. Please ask only law-related questions."

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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8088)