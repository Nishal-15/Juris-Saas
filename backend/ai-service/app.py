import os
import requests
import random
import time
from flask import Flask, request, jsonify
import re
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
import faiss # type: ignore
import numpy as np
from sentence_transformers import SentenceTransformer

# Load environment variables
load_dotenv()
try:
    import fitz # PyMuPDF
except ImportError:
    fitz = None

SUPPORTED_LANGUAGES = {
  "hi":  "Hindi",      "bn":  "Bengali",
  "te":  "Telugu",     "mr":  "Marathi",
  "ta":  "Tamil",      "gu":  "Gujarati",
  "kn":  "Kannada",    "ml":  "Malayalam",
  "or":  "Odia",       "pa":  "Punjabi",
  "as":  "Assamese",   "ur":  "Urdu",
  "mai": "Maithili",   "sat": "Santali",
  "kok": "Konkani",    "sd":  "Sindhi",
  "doi": "Dogri",      "ks":  "Kashmiri",
  "mni": "Manipuri",   "brx": "Bodo",
  "ne":  "Nepali",     "sa":  "Sanskrit",
  "en":  "English"
}

MEDIATION_ELIGIBLE = [
  "property dispute","boundary dispute",
  "property","family dispute","matrimonial",
  "maintenance","consumer complaint",
  "consumer","product defect",
  "commercial dispute","business dispute",
  "contract","landlord tenant","rent dispute",
  "eviction","partnership dispute",
  "employment dispute","neighbourhood dispute",
  "money recovery","cheque bounce",
  "insurance claim","medical negligence",
  "school fees","society dispute",
  "co-operative","intellectual property",
  "trademark","divorce","child custody",
  "domestic violence","deficiency in service"
]

MEDIATION_EXCLUSIONS = [
  "murder","rape","dacoity","terrorism",
  "national security","fir","arrest",
  "custody","bail","kidnapping","robbery"
]

def detect_language(text):
  """Auto-detect language using Google Cloud"""
  if not text or len(text) < 3:
    return "en"
  GKEY = os.getenv("GOOGLE_CLOUD_API_KEY","")
  if not GKEY:
    return "en"
  try:
    resp = requests.get(
      "https://translation.googleapis.com"
      "/language/translate/v2/detect",
      params={"q": text[:200], "key": GKEY},
      timeout=5
    )
    if resp.status_code == 200:
      detected = (resp.json()
        .get("data",{})
        .get("detections",[[{}]])[0][0]
        .get("language","en"))
      return detected if detected in \
        SUPPORTED_LANGUAGES else "en"
  except Exception as e:
    print(f"Lang detect error: {e}",flush=True)
  return "en"

def is_mediation_eligible(user_input,
  case_type=""):
  text = (
    (user_input or "") + " " +
    (case_type or "")
  ).lower()
  for excl in MEDIATION_EXCLUSIONS:
    if excl in text:
      return False
  return any(
    kw in text for kw in MEDIATION_ELIGIBLE
  )

def get_mediation_script(case_summary,
  lang, citizen_name="User"):
  lang_name = SUPPORTED_LANGUAGES.get(
    lang, "English"
  )
  system_prompt = f"""You are a professional
legal narrator for an AI video avatar.
Write a warm, clear, personalized spoken
script explaining mediation to a citizen.

Write ONLY the spoken words.
No stage directions. No brackets.
No formatting markers.

Language: {lang_name}
Citizen Name: {citizen_name}
Case Summary: {case_summary}

Structure:
1. Greeting using citizen name (1 sentence)
2. Acknowledge their specific case (1-2 sentences)
3. What mediation is in plain language (2-3 sentences)
4. Why it applies to their case (1-2 sentences)
5. Benefits spoken naturally:
   - Faster: 30-90 days vs 3-5 years
   - Cheaper: fraction of court costs
   - Private: nothing becomes public record
   - You stay in control
6. Mediation Act 2023 in one plain sentence
7. Closing: "Would you like me to connect you
   with a certified mediator, or would you
   prefer a verified lawyer first?"

Total: 150-200 words maximum.
Tone: Warm, reassuring, not robotic.
No legal jargon."""

  NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
  GROQ_API_KEY   = os.getenv("GROQ_API_KEY")

  if NVIDIA_API_KEY:
    try:
      url = ("https://integrate.api.nvidia.com"
             "/v1/chat/completions")
      payload = {
        "model": "meta/llama-3.1-8b-instruct",
        "messages": [
          {"role":"system","content":system_prompt},
          {"role":"user","content":
           f"Generate the mediation script for: "
           f"{case_summary}"}
        ],
        "temperature": 0.3,
        "max_tokens": 400
      }
      res = requests.post(
        url,
        headers={"Authorization":
          f"Bearer {NVIDIA_API_KEY}"},
        json=payload, timeout=20
      )
      data = res.json()
      if "choices" in data:
        return (data["choices"][0]
          ["message"]["content"])
    except Exception as e:
      print(f"NVIDIA mediation error: {e}",
            flush=True)

  if GROQ_API_KEY:
    try:
      url = ("https://api.groq.com"
             "/openai/v1/chat/completions")
      payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
          {"role":"system","content":system_prompt},
          {"role":"user","content":
           f"Generate the mediation script for: "
           f"{case_summary}"}
        ],
        "temperature": 0.3,
        "max_tokens": 400
      }
      res = requests.post(
        url,
        headers={"Authorization":
          f"Bearer {GROQ_API_KEY}"},
        json=payload, timeout=15
      )
      data = res.json()
      if "choices" in data:
        return (data["choices"][0]
          ["message"]["content"])
    except Exception as e:
      print(f"Groq mediation error: {e}",
            flush=True)

  return (
    f"Namaste {citizen_name}. Your case may "
    f"qualify for mediation under the Mediation "
    f"Act 2023. This means faster, cheaper, and "
    f"private resolution without going to court. "
    f"Would you like to connect with a mediator "
    f"or a verified lawyer?"
  )

def get_heygen_voice_id(lang):
  VOICE_MAP = {
    "hi": "hindi_female_1",
    "ta": "tamil_female_1",
    "te": "telugu_female_1",
    "bn": "bengali_female_1",
    "mr": "marathi_female_1",
    "gu": "gujarati_female_1",
    "kn": "kannada_female_1",
    "ml": "malayalam_female_1",
    "pa": "punjabi_female_1",
    "or": "odia_female_1",
    "ur": "urdu_female_1",
    "as": "assamese_female_1",
    "en": "en-IN-NeerjaNeural"
  }
  return VOICE_MAP.get(
    lang, "en-IN-NeerjaNeural"
  )

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "jurisbot-index")

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# Initialize FAISS and Embedding Model
try:
    print("Initializing FAISS & Embedding Model...", flush=True)
    faiss_index = faiss.read_index("faiss.index")
    faiss_meta = np.load("meta.npy", allow_pickle=True)
    embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    print("SUCCESS: Local FAISS RAG Engine Ready", flush=True)
except Exception as e:
    print(f"ERROR: FAISS Init Error: {e}", flush=True)
    faiss_index = None
    faiss_meta = None
    embed_model = None

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from Flutter

# =========================
# ZERO-DATA RETENTION (PII Redaction)
# =========================
def redact_pii(text):
    if not text: return text
    # Redact Aadhaar (12 digits)
    text = re.sub(r'\b\d{4}\s?\d{4}\s?\d{4}\b', '[REDACTED_AADHAAR]', text)
    # Redact Phone Numbers (10 digits)
    text = re.sub(r'\b[6-9]\d{9}\b', '[REDACTED_PHONE]', text)
    # Redact Emails
    text = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', '[REDACTED_EMAIL]', text)
    # Redact PAN Card (5 letters, 4 digits, 1 letter)
    text = re.sub(r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b', '[REDACTED_PAN]', text)
    return text

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

    api_err = "No error recorded"

    # 2. RETRIEVE LEGAL CONTEXT (RAG)
    legal_context = ""
    if faiss_index and faiss_meta is not None and embed_model:
        try:
            print("Retrieving context for a legal query... (Zero-Data Logging)", flush=True)
            query_vector = embed_model.encode([user_input]).astype("float32")
            distances, indices = faiss_index.search(query_vector, 3)
            
            contexts = []
            for idx in indices[0]:
                if idx != -1 and idx < len(faiss_meta):
                    meta = faiss_meta[idx]
                    contexts.append(f"Source: {meta.get('act', 'Unknown')} ({meta.get('year', 'Unknown')})\nSection: {meta.get('heading', 'Unknown')}\nContent: {meta.get('content', '')}")
            
            legal_context = "\n\n---\n\n".join(contexts)
        except Exception as e:
            print(f"RAG Retrieval Error: {e}", flush=True)

    # 3. STRICT SYSTEM PROMPT
    lang_name = SUPPORTED_LANGUAGES.get(lang, "English")
    if is_notification:
        system_instruction = "You are a professional Legal Expert. Write a short, professional 1-sentence legal notification for WhatsApp. Be concise."
    else:
        system_instruction = f"""
You are an advanced AI legal assistant for Indian law. Your goal is to explain legal topics in simple language while staying 100% legally accurate.

You have been provided with the following REAL LAW SECTIONS as context. Use them to answer the user's question accurately.

LEGAL CONTEXT (VERIFIED SOURCES):
{legal_context if legal_context else "No specific sections found in database. Use your internal knowledge but be extremely cautious."}

CORE OBJECTIVE:
- Explain what the issue means in REAL LIFE first.
- Use the provided LEGAL CONTEXT to ensure the highest accuracy.
- If the context contradicts your internal knowledge, trust the context.
- Sound knowledgeable and helpful, not robotic.

MANDATORY RESPONSE FORMAT:

**Direct Answer** (max 2 lines)
- Plain English only. No section numbers.

**Quick Understanding** (3-5 bullets)
- Real-world meaning and consequences.

**Legal Support**
- Mention the specific Acts/Sections from the provided context.
- Be precise about what the law says.

**Practical Insight**
- Real-world handling by police/courts.

**Simple Example**
- Relatable scenario (max 3 lines).

Answer in {lang_name}. Use {lang_name} vocabulary appropriate for a common citizen unfamiliar with legal terminology.
"""

    # 4. NVIDIA — First Priority
    NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
    if NVIDIA_API_KEY:
        try:
            print("Sending to NVIDIA (meta/llama-3.1-8b-instruct)...", flush=True)
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            payload = {
                "model": "meta/llama-3.1-8b-instruct",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": redact_pii(user_input)}
                ],
                "temperature": 0.2,
                "max_tokens": 1500
            }
            res = requests.post(url, headers={"Authorization": f"Bearer {NVIDIA_API_KEY}"}, json=payload, timeout=20)
            data = res.json()
            if "choices" in data:
                print("SUCCESS: NVIDIA responded successfully!", flush=True)
                return data["choices"][0]["message"]["content"]
            else:
                api_err = f"NVIDIA API Error: {data}"
                print(api_err, flush=True)
        except Exception as e:
            api_err = f"NVIDIA timeout or error: {str(e)}"
            print(api_err, flush=True)

    # 4.5. Groq Fallback
    if GROQ_API_KEY:
        try:
            print("NVIDIA failed/timed out. Falling back to Groq...", flush=True)
            url = "https://api.groq.com/openai/v1/chat/completions"
            payload = {
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": redact_pii(user_input)}
                ],
                "temperature": 0.2,
                "max_tokens": 1500
            }
            res = requests.post(url, headers={"Authorization": f"Bearer {GROQ_API_KEY}"}, json=payload, timeout=10)
            data = res.json()
            if "choices" in data:
                print("SUCCESS: Groq responded successfully!", flush=True)
                return data["choices"][0]["message"]["content"]
            else:
                api_err = f"Groq API Error: {data}"
                print(api_err, flush=True)
        except Exception as e:
            api_err = f"Groq timeout or error: {str(e)}"
            print(api_err, flush=True)

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

    return f"JurisBot is having trouble connecting to its cloud brain. (Debug: {api_err})"


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.json
        user_input = data.get("message", "")
        lang = data.get("lang", "en")
        if lang == "auto" or not lang:
            lang = detect_language(user_input)
        user_name = data.get("userName", "User")

        greeting = handle_greeting(user_input, user_name)
        if greeting: return jsonify({"answer": greeting})

        answer = get_legal_answer(user_input, lang)
        return jsonify({
            "answer": answer,
            "detectedLang": lang,
            "detectedLangName": SUPPORTED_LANGUAGES.get(lang, "English")
        })

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}", flush=True)
        return jsonify({"error": "Internal AI server error"}), 500

@app.route("/analyze-document", methods=["POST"])
def analyze_document():
    try:
        data = request.json
        file_path = data.get("filePath")
        
        if not file_path or not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 400
            
        if not fitz:
            return jsonify({"error": "PyMuPDF not installed in AI service"}), 500

        print(f"Analyzing Document: {file_path}", flush=True)
        doc = fitz.open(file_path)
        text = ""
        # Extract text from up to 50 pages to avoid massive token limits
        for i in range(min(len(doc), 50)):
            text += doc[i].get_text("text") + "\n"
        if not text.strip():
            print("No digital text found. Switching to Advanced OCR Vision Mode...", flush=True)
            import base64
            images_content = []
            # Extract first 3 pages as images to avoid payload limits
            for i in range(min(len(doc), 3)):
                pix = doc[i].get_pixmap(dpi=150)
                img_data = pix.tobytes("jpeg")
                b64 = base64.b64encode(img_data).decode("utf-8")
                images_content.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})
            doc.close()
            
            GROQ_API_KEY = os.getenv("GROQ_API_KEY")
            if not GROQ_API_KEY:
                return jsonify({"error": "Groq API Key required for OCR Vision processing."}), 500
                
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                user_content = [{"type": "text", "text": "You are a Legal AI. This is a scanned legal document. Please perform OCR to read the text, and then provide a structured summary exactly like this:\n**Document Overview**\n(2 sentences)\n**Key Facts & Claims**\n- (Bullet points)\n**Important Dates & Deadlines**\n- (List dates)\n**Potential Weaknesses / Red Flags**\n- (List weaknesses)"}]
                user_content.extend(images_content)
                
                payload = {
                    "model": "llama-3.2-11b-vision-preview",
                    "messages": [{"role": "user", "content": user_content}],
                    "temperature": 0.2,
                    "max_tokens": 1000
                }
                res = requests.post(url, headers={"Authorization": f"Bearer {GROQ_API_KEY}"}, json=payload, timeout=60)
                res_data = res.json()
                if "choices" in res_data:
                    return jsonify({"summary": res_data["choices"][0]["message"]["content"]})
                else:
                    return jsonify({"error": f"OCR Vision Error: {res_data}"}), 500
            except Exception as e:
                return jsonify({"error": f"OCR Vision failed: {str(e)}"}), 500
        
        doc.close()
            
        # Truncate text roughly to fit LLM context windows (e.g. 15000 chars)
        truncated_text = text[:15000]
        
        system_instruction = """
You are an expert Legal AI Assistant. You have been provided with the text extracted from a legal document.
Your task is to provide a structured, easy-to-read summary of this document.

Format your response exactly like this:
**Document Overview**
(2-3 sentences explaining what this document is)

**Key Facts & Claims**
- (Bullet point 1)
- (Bullet point 2)
- (Bullet point 3)

**Important Dates & Deadlines**
- (List any dates found, or write 'No specific dates found')

**Potential Weaknesses / Red Flags**
- (Highlight any missing info or legal weaknesses)
"""
        
        # Use NVIDIA API (Priority 1)
        NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
        if NVIDIA_API_KEY:
            try:
                url = "https://integrate.api.nvidia.com/v1/chat/completions"
                payload = {
                    "model": "meta/llama-3.1-8b-instruct",
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Here is the document text:\n\n{truncated_text}"}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1000
                }
                res = requests.post(url, headers={"Authorization": f"Bearer {NVIDIA_API_KEY}"}, json=payload, timeout=45)
                res_data = res.json()
                if "choices" in res_data:
                    print("SUCCESS: NVIDIA analyzed document successfully!", flush=True)
                    return jsonify({"summary": res_data["choices"][0]["message"]["content"]})
                else:
                    print(f"NVIDIA doc analysis error: {res_data}", flush=True)
            except Exception as e:
                print(f"NVIDIA error during analysis: {str(e)}", flush=True)
                
        # Use Groq (Priority 2)
        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        if GROQ_API_KEY:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                payload = {
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Here is the document text:\n\n{truncated_text}"}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 1500
                }
                res = requests.post(url, headers={"Authorization": f"Bearer {GROQ_API_KEY}"}, json=payload, timeout=15)
                res_data = res.json()
                if "choices" in res_data:
                    return jsonify({"summary": res_data["choices"][0]["message"]["content"]})
            except Exception as e:
                print(f"Groq error during analysis: {str(e)}", flush=True)

        return jsonify({"error": "All AI APIs failed to analyze the document."}), 500

    except Exception as e:
        print(f"Document Analysis Error: {str(e)}", flush=True)
        return jsonify({"error": "Failed to analyze document"}), 500




@app.route("/draft-document", methods=["POST"])
def draft_document():
    try:
        data = request.json
        doc_type = data.get("docType")
        facts = data.get("facts")
        
        if not doc_type or not facts:
            return jsonify({"error": "Missing docType or facts"}), 400
            
        system_instruction = f"""
You are a highly experienced Indian Legal Draftsman. Your task is to generate a fully formatted, professional {doc_type}.
Ensure you use the appropriate legal language, jurisdiction formatting, and structure standard for Indian courts or contracts.

Here are the key facts provided by the lawyer:
{redact_pii(facts)}

Generate the document using Markdown formatting. Use bold for headings and parties. Leave placeholders like '[Client Name]' or '[Date]' where information is missing. Do not include any introductory conversation, just output the legal document directly.
"""
        
        # Use Groq for ultra-fast generation
        GROQ_API_KEY = os.getenv("GROQ_API_KEY")
        if GROQ_API_KEY:
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                payload = {
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": system_instruction}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 2048
                }
                res = requests.post(url, headers={"Authorization": f"Bearer {GROQ_API_KEY}"}, json=payload, timeout=20)
                res_data = res.json()
                if "choices" in res_data:
                    return jsonify({"draft": res_data["choices"][0]["message"]["content"]})
            except Exception as e:
                print(f"Groq drafting error: {str(e)}", flush=True)

        return jsonify({"error": "AI failed to generate draft."}), 500

    except Exception as e:
        print(f"Drafting Error: {str(e)}", flush=True)
        return jsonify({"error": "Internal AI server error during drafting"}), 500

@app.route("/mediation-video", methods=["POST"])
def mediation_video():
  try:
    data         = request.json
    case_title   = data.get("caseTitle","")
    case_type    = data.get("caseType","")
    citizen_name = data.get("citizenName","User")
    lang         = data.get("lang","auto")
    user_input   = data.get("userInput","")

    if lang == "auto" or not lang:
      lang = detect_language(
        user_input or case_title
      )

    eligible = is_mediation_eligible(
      user_input + " " + case_type,
      case_type
    )

    if not eligible:
      return jsonify({
        "eligible":  False,
        "script":    None,
        "videoUrl":  None,
        "lang":      lang,
        "langName":  SUPPORTED_LANGUAGES.get(
          lang,"English"
        )
      })

    script = get_mediation_script(
      case_summary = case_title or user_input,
      lang         = lang,
      citizen_name = citizen_name
    )

    video_url      = None
    video_id_only  = None
    HEYGEN_KEY     = os.getenv("HEYGEN_API_KEY")
    HEYGEN_AVATAR  = os.getenv(
      "HEYGEN_AVATAR_ID","")

    if HEYGEN_KEY and HEYGEN_AVATAR and script:
      try:
        payload = {
          "video_inputs": [{
            "character": {
              "type":         "avatar",
              "avatar_id":    HEYGEN_AVATAR,
              "avatar_style": "normal"
            },
            "voice": {
              "type":       "text",
              "input_text": script,
              "voice_id":   get_heygen_voice_id(
                lang
              )
            },
            "background": {
              "type":  "color",
              "value": "#0d0f1a"
            }
          }],
          "aspect_ratio": "16:9",
          "test": True
        }
        hres = requests.post(
          "https://api.heygen.com/v2/video/generate",
          headers={
            "X-Api-Key":     HEYGEN_KEY,
            "Content-Type":  "application/json"
          },
          json=payload, timeout=30
        )
        if hres.status_code == 200:
          hdata     = hres.json()
          video_url = (hdata.get("data",{})
            .get("video_url"))
          vid_id    = (hdata.get("data",{})
            .get("video_id"))
          if not video_url and vid_id:
            video_url = f"pending:{vid_id}"
            video_id_only = vid_id
      except Exception as e:
        print(f"HeyGen error: {e}", flush=True)

    return jsonify({
      "eligible":     True,
      "script":       script,
      "videoUrl":     video_url,
      "videoId":      video_id_only,
      "lang":         lang,
      "langName":     SUPPORTED_LANGUAGES.get(
        lang, "English"
      ),
      "mediationAct": {
        "actName":
          "The Mediation Act, 2023",
        "enforcedDate":
          "9 October 2023",
        "keyBenefit":
          "Faster and private dispute "
          "resolution without court"
      }
    })

  except Exception as e:
    print(f"Mediation video error: {e}",
          flush=True)
    return jsonify({
      "error": str(e)
    }), 500

@app.route(
  "/mediation-video/status/<video_id>",
  methods=["GET"]
)
def check_video_status(video_id):
  HEYGEN_KEY = os.getenv("HEYGEN_API_KEY")
  if not HEYGEN_KEY:
    return jsonify({
      "status": "error",
      "message": "No HeyGen API key"
    }), 400
  try:
    res = requests.get(
      f"https://api.heygen.com/v1/"
      f"video_status.get?video_id={video_id}",
      headers={"X-Api-Key": HEYGEN_KEY},
      timeout=10
    )
    data      = res.json()
    status    = (data.get("data",{})
      .get("status","processing"))
    video_url = (data.get("data",{})
      .get("video_url"))
    return jsonify({
      "status":   status,
      "videoUrl": video_url,
      "videoId":  video_id
    })
  except Exception as e:
    return jsonify({
      "status": "error",
      "message": str(e)
    }), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8088)