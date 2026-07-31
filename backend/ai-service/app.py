import os
import requests
import random
import time
from flask import Flask, request, jsonify
import re
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
try:
    import faiss # type: ignore
    import numpy as np
    from sentence_transformers import SentenceTransformer
except ImportError:
    faiss = None
    np = None
    SentenceTransformer = None
import pickle

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

RTL_LANGUAGES = ["ur", "ks", "sd"]

MEDIATION_ELIGIBLE = [
  # Family Law
  "mutual divorce", "divorce settlement", "child custody", "custody arrangement",
  "visitation rights", "maintenance", "alimony", "matrimonial property",
  "family business dispute", "matrimonial", "family dispute", "dowry settlement",
  # Property Law
  "property partition", "boundary dispute", "easement rights", "landlord tenant",
  "rent dispute", "lease agreement", "builder buyer", "delay in possession",
  "property maintenance", "property dispute", "eviction", "landlord", "tenant",
  # Civil Law
  "money recovery", "outstanding dues", "breach of contract", "loan repayment",
  "service agreement", "partnership settlement", "partnership dispute", "indemnity dispute",
  "cheque bounce", "section 138", "civil suit",
  # Commercial Law
  "commercial contract", "vendor agreement", "supply agreement", "franchise dispute",
  "distribution agreement", "agency agreement", "joint venture", "business dispute",
  "commercial dispute", "pre-litigation commercial",
  # Corporate Law
  "shareholder dispute", "director dispute", "business dissolution", "share transfer",
  # Labour & Employment
  "salary dispute", "final settlement", "employment contract", "wrongful termination",
  "workplace conflict", "employment dispute", "wages", "gratuity",
  # Consumer Law
  "refund dispute", "defective product", "deficient service", "warranty claim",
  "e-commerce refund", "consumer complaint", "consumer",
  # Banking & Finance
  "loan settlement", "emi restructuring", "banking service complaint", "bank dispute",
  # Insurance Law
  "insurance claim", "policy dispute", "motor accident compensation", "mact",
  # Intellectual Property
  "licensing dispute", "royalty dispute", "ip assignment", "trademark", "copyright", "patent",
  # Technology & E-Commerce Law
  "software development", "saas agreement", "it service agreement",
  "marketplace seller dispute", "online service agreement",
  # Education & Healthcare Law
  "fee refund", "admission refund", "school fees", "hospital billing", "medical service billing",
  # Neighbourhood & Community Disputes
  "noise complaint", "shared access", "water usage", "resident welfare", "rwa",
  "society maintenance", "co-operative", "neighbourhood dispute", "society dispute",
  # General Consensual & Civil Dispute Keywords
  "mediation", "settle", "settlement", "partner", "partition", "garment", "dispute", "friend", "inheritance", "inherited", "agreement", "divide", "division", "mutual", "civil", "share", "investment", "profit", "expense", "sibling"
]

MEDIATION_EXCLUSIONS = [
  # Criminal Law (Non-compoundable / Serious offences & Physical Assault)
  "murder", "attempt to murder", "rape", "gang rape", "terrorism",
  "human trafficking", "kidnapping for ransom", "kidnapping", "armed robbery",
  "dacoity", "serious assault", "assault", "assaulted", "wooden stick", "weapon",
  "acid attack", "waging war", "narcotics", "ndps", "counterfeit currency",
  "voluntarily causing hurt", "bodily harm", "injury", "injuries", "hurt",
  "criminal intimidation", "intentional insult", "obscene language",
  # Police & Criminal Procedures
  "police station", "police complaint", "complaint was lodged", "accused", "complainant",
  "bns", "bharatiya nyaya sanhita", "ipc", "crpc", "bnss", "crime", "criminal",
  "illegal custody", "police custody", "judicial custody", "remand", "fir", "arrest", "bail", "non-bailable",
  # Public & Constitutional Law
  "election petition", "writ petition", "habeas corpus", "mandamus", "quo warranto",
  # Administrative Law & Civil Status
  "professional misconduct", "bar council", "declaration of title against government",
  "rights in rem", "first schedule"
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

def is_mediation_eligible(user_input, case_type=""):
  text = ((user_input or "") + " " + (case_type or "")).lower()
  for excl in MEDIATION_EXCLUSIONS:
    if excl in text:
      return False
  return any(kw in text for kw in MEDIATION_ELIGIBLE)

def get_case_classification_labels(text, case_type=""):
  combined = ((text or "") + " " + (case_type or "")).lower()
  for excl in MEDIATION_EXCLUSIONS:
    if excl in combined:
      return {
        "legal_classification": "Criminal / Public / Constitutional Law",
        "case_type": case_type or "Non-Compoundable / Public Dispute",
        "mediation_eligible": False,
        "resolution_method": "Court Litigation / Prosecution",
        "alternative_resolution": ["High Court", "District Session Court", "Appropriate Tribunal"]
      }
  classification_map = [
    (["divorce", "custody", "visitation", "alimony", "matrimonial", "family"], "Family Law", "Family Dispute / Settlement", ["Family Court"]),
    (["property", "boundary", "easement", "landlord", "tenant", "rent", "lease", "builder"], "Property Law", "Property / Tenancy Dispute", ["Civil Court", "RERA"]),
    (["commercial", "vendor", "supply", "franchise", "distribution", "agency", "joint venture"], "Commercial Law", "Commercial Contract Dispute", ["Commercial Court"]),
    (["shareholder", "director", "dissolution", "share transfer", "corporate"], "Corporate Law", "Corporate Governance Dispute", ["NCLT", "Commercial Court"]),
    (["salary", "settlement", "employment", "termination", "workplace", "labour"], "Labour & Employment", "Employment Dispute", ["Labour Court", "Industrial Tribunal"]),
    (["refund", "defective", "deficient", "warranty", "e-commerce", "consumer"], "Consumer Law", "Consumer Dispute", ["Consumer Dispute Redressal Commission"]),
    (["loan", "emi", "banking", "cheque", "138", "money recovery", "dues", "breach of contract", "partnership"], "Civil Law / Banking", "Commercial / Loan Repayment Dispute", ["Civil Court", "DRT", "Commercial Court"]),
    (["insurance", "policy", "claim", "accident", "mact"], "Insurance Law", "Insurance Claim Settlement", ["Motor Accident Claims Tribunal", "Consumer Forum"]),
    (["licensing", "royalty", "ip assignment", "trademark", "copyright", "patent"], "Intellectual Property", "IP Licensing / Royalty Dispute", ["High Court / Commercial Division"]),
    (["software", "saas", "it service", "marketplace", "online service"], "Technology Law", "IT / E-Commerce Agreement Dispute", ["Commercial Court", "Cyber Appellate Tribunal"]),
    (["fee refund", "admission", "hospital billing", "medical billing", "school"], "Education / Healthcare Law", "Service & Billing Dispute", ["Consumer Forum", "Civil Court"]),
    (["noise", "shared access", "water usage", "resident welfare", "rwa", "society", "neighbour"], "Community / Neighbourhood Disputes", "Society / Resident Dispute", ["Co-operative Court", "Civil Court"])
  ]
  for keywords, leg_class, c_type, alt_res in classification_map:
    if any(kw in combined for kw in keywords):
      return {
        "legal_classification": leg_class,
        "case_type": case_type or c_type,
        "mediation_eligible": True,
        "resolution_method": "Pre-Litigation Mediation",
        "alternative_resolution": alt_res
      }
  eligible = any(kw in combined for kw in MEDIATION_ELIGIBLE)
  return {
    "legal_classification": "Civil / Commercial Law" if eligible else "General Legal Dispute",
    "case_type": case_type or "General Dispute",
    "mediation_eligible": eligible,
    "resolution_method": "Pre-Litigation Mediation" if eligible else "Court Litigation",
    "alternative_resolution": ["District Civil Court" if eligible else "Appropriate Court"]
  }

def get_mediation_script(case_summary,
  lang, citizen_name="User"):
  lang_name = SUPPORTED_LANGUAGES.get(
    lang, "English"
  )
  if lang in RTL_LANGUAGES:
    rtl_note = "Format for RTL script."
  else:
    rtl_note = ""

  system_prompt = f"""You are a professional
legal narrator for an AI video avatar.
Write a warm, clear, personalized spoken
script explaining mediation to a citizen.

Write ONLY the spoken words.
No stage directions. No brackets.
No formatting markers.

Language: {lang_name} ({lang})
Citizen Name: {citizen_name}
Case Summary: {case_summary}

CRITICAL LANGUAGE RULES:
- Write the ENTIRE script in {lang_name}.
- Do NOT use English unless the target language IS English.
- Speak naturally as an empathetic legal guide would in {lang_name}.
- {rtl_note}

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
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

# Initialize FAISS and Embedding Model
try:
    print("Initializing FAISS & Embedding Model...", flush=True)
    if SentenceTransformer is None or faiss is None or np is None:
        raise ImportError("FAISS, SentenceTransformer, or numpy not installed in serverless mode.")
    embed_model = SentenceTransformer("all-MiniLM-L6-v2")
    if os.path.exists("faiss_index.bin") and os.path.exists("faiss_meta.pkl"):
        faiss_index = faiss.read_index("faiss_index.bin")
        with open("faiss_meta.pkl", "rb") as f:
            faiss_meta = pickle.load(f)
        print(f"[FAISS] Loaded {faiss_index.ntotal} vectors from disk", flush=True)
    elif os.path.exists("faiss.index") and os.path.exists("meta.npy"):
        faiss_index = faiss.read_index("faiss.index")
        faiss_meta = np.load("meta.npy", allow_pickle=True)
        print(f"[FAISS] Loaded {faiss_index.ntotal} vectors from disk", flush=True)
    else:
        dimension = embed_model.get_sentence_embedding_dimension()
        faiss_index = faiss.IndexFlatL2(dimension)
        faiss_meta = []
        print("[FAISS] Initialized empty index", flush=True)
    print("SUCCESS: Local FAISS RAG Engine Ready", flush=True)
except Exception as e:
    print(f"ERROR: FAISS Init Error: {e}", flush=True)
    faiss_index = None
    faiss_meta = None
    embed_model = None

def save_faiss_index():
    if faiss_index is not None and faiss_meta is not None:
        try:
            faiss.write_index(faiss_index, "faiss_index.bin")
            with open("faiss_meta.pkl", "wb") as f:
                pickle.dump(faiss_meta, f)
            print("[FAISS] Index and metadata saved to disk", flush=True)
        except Exception as e:
            print(f"[FAISS Error] Could not save index: {e}", flush=True)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": [os.getenv("BACKEND_URL", "http://localhost:5000"), "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://jurisbot.vercel.app"]}})

@app.route("/", methods=["GET"])
def health_check():
    return jsonify({
        "service": "JurisVault AI Engine",
        "status": "online",
        "version": "2.0",
        "engine": "NVIDIA NIM & Groq Hybrid"
    }), 200

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
    "lifestyle", "science", "religion", "python", "script", "code", "coding",
    "programming", "javascript", "html", "css", "sql", "algorithm",
    "prime minister", "president", "general knowledge", "trivia", "math",
    "calculate", "physics", "chemistry", "biology", "history", "geography"
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

def get_tavily_context(query):
    TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
    if not TAVILY_API_KEY:
        return ""
    try:
        print(f"Searching web for latest Indian Laws via Tavily: {query}", flush=True)
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": TAVILY_API_KEY,
            "query": query + " (Latest Indian Law, BNS, BNSS, BSA)",
            "search_depth": "advanced",
            "include_domains": [
                "indiankanoon.org",
                "scconline.com",
                "livelaw.in",
                "barandbench.com",
                "indiacode.nic.in",
                "main.sci.gov.in",
                "prsindia.org"
            ],
            "include_answer": True,
            "max_results": 3
        }
        res = requests.post(url, json=payload, timeout=8)
        data = res.json()
        if "answer" in data and data["answer"]:
            return f"\n\n[LATEST REAL-TIME WEB CONTEXT]\n{data['answer']}\n"
        elif "results" in data and len(data["results"]) > 0:
            content = "\n\n[LATEST REAL-TIME WEB CONTEXT]\n"
            for r in data["results"]:
                content += f"- {r.get('content', '')}\n"
            return content
    except Exception as e:
        print(f"Tavily Search Error: {e}", flush=True)
    return ""

def get_legal_answer(user_input, lang="en", history=None):
    if history is None: history = []
    # 1. Hard Filter for common non-legal topics
    if any(topic in user_input.lower() for topic in REJECTED_CATEGORIES):
        return "Sorry, I can't provide an answer for this. I am JurisBot, trained exclusively for Indian law. Please ask only legal questions."

    # NEW: Detection for short notification/reminder prompts
    is_notification = any(x in user_input.lower() for x in ["reminder", "alert", "whatsapp", "1-sentence"])

    api_err = "No error recorded"

    # 2. RETRIEVE LEGAL CONTEXT (RAG & Web Search)
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

    # 2.5 REAL-TIME WEB SEARCH VIA TAVILY
    web_context = get_tavily_context(user_input)
    if web_context:
        legal_context += web_context

    # 3. STRICT SYSTEM PROMPT
    lang_name = SUPPORTED_LANGUAGES.get(lang, "English")
    if is_notification:
        system_instruction = "You are a professional Legal Expert. Write a short, professional 1-sentence legal notification for WhatsApp. Be concise."
    else:
        system_instruction = f"""
# ROLE

You are JurisBot, an AI-powered Indian Legal Assistant.

Your responsibility is to provide legally accurate, citizen-friendly, and easy-to-understand legal information based ONLY on the CURRENTLY APPLICABLE LAWS OF INDIA.

You are NOT a lawyer.
You do NOT provide legal representation.
You provide legal information, legal education, procedural guidance, and document assistance.

------------------------------------------------------------

# PRIMARY RULE

Always answer using the LATEST APPLICABLE INDIAN LAW.

Use:
• Bharatiya Nyaya Sanhita, 2023 (BNS)
• Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)
• Bharatiya Sakshya Adhiniyam, 2023 (BSA)
• Digital Personal Data Protection Act, 2023
• Companies Act, 2013
• Consumer Protection Act, 2019
• Income-tax Act, 1961 (as amended)
• CGST Act, 2017 (as amended)
• Information Technology Act, 2000 (where still applicable)
• Any other CURRENTLY ENFORCEABLE Indian statute.

NEVER cite repealed provisions.
Never use:
❌ IPC (Indian Penal Code)
❌ CrPC (Code of Criminal Procedure)
❌ IEA (Indian Evidence Act)

Instead, YOU MUST USE:
✅ BNS (Bharatiya Nyaya Sanhita) for penal offenses (e.g., Cheating is now Sec 318(4) BNS, Murder is Sec 103 BNS, etc.)
✅ BNSS (Bharatiya Nagarik Suraksha Sanhita) for criminal procedure
✅ BSA (Bharatiya Sakshya Adhiniyam) for evidence
unless the user specifically asks for historical laws or comparison.

------------------------------------------------------------

# IF CURRENT LAW CANNOT BE VERIFIED
Never guess. Instead respond:
"The exact statutory provision should be verified from the currently applicable law before relying on it."

------------------------------------------------------------

# RESPONSE FORMAT

# 📌 Title

------------------------------------------------------------

## ⚡ Quick Answer
Give a direct answer in simple English. Maximum 3 sentences.

------------------------------------------------------------

## ⚖️ Applicable Law
Law:
Section:
Category:
Nature of Law:

------------------------------------------------------------

## 📖 Explanation
Explain the law in plain English. Avoid legal jargon. Keep it concise and easy to understand. Maximum 200 words.

------------------------------------------------------------

## 💡 Example
Provide one practical, realistic example.

------------------------------------------------------------

## ⚖️ Punishment / Legal Remedy
If Criminal:
• Punishment
• Fine
• Imprisonment
• Bail Status (if relevant)
• Cognizable / Non-Cognizable (if relevant)

If Civil:
• Available legal remedies
• Compensation
• Damages
• Injunction
• Specific Performance

------------------------------------------------------------

## 📂 Documents Required
List only relevant documents.

------------------------------------------------------------

## 🏛️ Where to File
Mention the appropriate authority/court (e.g., Police Station, Magistrate Court, Consumer Commission, Cyber Crime Cell).

------------------------------------------------------------

## 🔹 Important Points
• Point 1
• Point 2
• Point 3

------------------------------------------------------------

## ❓ Frequently Asked Questions
Q1. 
A1.

Q2. 
A2.

------------------------------------------------------------

## ⚠️ Disclaimer
This information is for educational purposes and should not be considered legal advice. Consult a qualified advocate for advice specific to your case.

------------------------------------------------------------

# GENERAL RULES
1. Use only current Indian laws.
2. Never invent section numbers.
3. Never hallucinate legal provisions.
4. If unsure, say verification is required.
5. Never fabricate punishments.
6. Never promise legal outcomes.
7. Use simple English.
8. Avoid unnecessary legal jargon.
9. Explain technical legal terms.
10. Use headings and bullet points.
11. If the user describes a personal legal issue, ask only the minimum follow-up questions needed before suggesting legal options.
12. Clearly distinguish between Criminal, Civil, Corporate, Labour, Consumer, Family, Cyber, Taxation, Constitutional, and Administrative matters.
13. Mention procedural steps only when reasonably certain under the current law.
14. Keep responses concise but complete.
15. Never expose internal reasoning.
16. Never cite outdated statutes unless the user explicitly asks for them.
17. If there has been a recent legislative change and you cannot verify it, state that the user should verify the latest amendment before acting.

LEGAL CONTEXT:
{legal_context if legal_context else "No specific sections found. Use internal Indian law knowledge."}
"""

    if lang in RTL_LANGUAGES:
        lang_direction_note = (
            "This is a Right-to-Left (RTL) language. "
            "Ensure clean formatting without breaking "
            "words across lines."
        )
    else:
        lang_direction_note = ""

    system_instruction += f"""
⚠️ ABSOLUTE LANGUAGE RULE — HIGHEST PRIORITY (NO EXCEPTIONS):
- User selected language: {lang_name} ({lang})
- Your ENTIRE response MUST be in {lang_name} ONLY.
- Even if the user writes in Hindi, if they selected English (en) → reply in English.
- Even if the user writes in English, if they selected Hindi (hi) → reply in Hindi.
- NEVER mix any two languages in the same response.
- For untranslatable legal terms (FIR, Bail, Affidavit, Writ), write the English term in parentheses.
- {lang_direction_note}
"""

    # Build message chain with conversation history
    messages_list = [{"role": "system", "content": system_instruction}]
    for msg in history:
        role = "assistant" if msg.get("role") == "bot" else "user"
        messages_list.append({"role": role, "content": msg.get("text", "")})
    messages_list.append({"role": "user", "content": redact_pii(user_input)})

    # 4. NVIDIA — First Priority
    NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
    if NVIDIA_API_KEY:
        try:
            print("Sending to NVIDIA (meta/llama-3.1-8b-instruct)...", flush=True)
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            payload = {
                "model": "meta/llama-3.1-8b-instruct",
                "messages": messages_list,
                "temperature": 0.2,
                "max_tokens": 600
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
                "messages": messages_list,
                "temperature": 0.2,
                "max_tokens": 600
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
            history_context = ""
            for msg in history[-6:]: # last 6 messages
                sender = "Assistant" if msg.get("role") == "bot" else "User"
                history_context += f"{sender}: {msg.get('text', '')}\n"
            payload = {"model": "mistral", "prompt": f"{system_instruction}\n\nConversation History:\n{history_context}\nQuery: {user_input}", "stream": False}
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
        history = data.get("history", [])

        greeting = handle_greeting(user_input, user_name)
        if greeting: return jsonify({"answer": greeting})

        answer = get_legal_answer(user_input, lang, history)
        return jsonify({
            "answer": answer,
            "detectedLang": lang,
            "detectedLangName": SUPPORTED_LANGUAGES.get(lang, "English")
        })

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}", flush=True)
        return jsonify({"error": "Internal AI server error"}), 500

@app.route("/upload-law", methods=["POST"])
def upload_law():
    global faiss_meta
    try:
        data = request.json
        text = data.get("text", "")
        act_name = data.get("act", "General Statute")
        year = data.get("year", "2024")
        if text and embed_model and faiss_index is not None:
            vec = embed_model.encode([text]).astype("float32")
            faiss_index.add(vec)
            if isinstance(faiss_meta, list):
                faiss_meta.append({"act": act_name, "year": year, "heading": "Uploaded Section", "content": text})
            elif isinstance(faiss_meta, np.ndarray):
                faiss_meta = np.append(faiss_meta, {"act": act_name, "year": year, "heading": "Uploaded Section", "content": text})
            save_faiss_index()
        return jsonify({"status": "success", "message": "Law indexed successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-document", methods=["POST"])
def analyze_document():
    global faiss_meta
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
        
        if truncated_text.strip() and embed_model and faiss_index is not None:
            try:
                vec = embed_model.encode([truncated_text[:1000]]).astype("float32")
                faiss_index.add(vec)
                if isinstance(faiss_meta, list):
                    faiss_meta.append({"act": "Analyzed Document", "year": "2024", "heading": os.path.basename(file_path), "content": truncated_text[:1000]})
                elif isinstance(faiss_meta, np.ndarray):
                    faiss_meta = np.append(faiss_meta, {"act": "Analyzed Document", "year": "2024", "heading": os.path.basename(file_path), "content": truncated_text[:1000]})
                save_faiss_index()
            except Exception as ex:
                print(f"[FAISS] Could not index analyzed document: {ex}", flush=True)
        
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

Generate the document using Markdown formatting. Leave placeholders like '[Client Name]' or '[Date]' where information is missing. Do not include any introductory conversation, just output the legal document directly.

CRITICAL INSTRUCTION: Your output MUST strictly follow the exact visual structure below. Use Markdown headings (**Heading**) for the centered titles, and standard text for the rest.

**IN THE COURT OF THE _______, AT _______**
**[CASE TYPE] NO. _______ OF 2026**

**Cause Title: [Applicant/Petitioner Name] vs [Respondent Name]**

1. That the Applicant / Petitioner is a resident of _______ and is a law-abiding citizen of India [or describe company/entity status].
2. [Insert tailored legal paragraph based on facts]
3. [Insert tailored legal paragraph based on facts]
...

**MOST RESPECTFULLY SHOWETH**

**PRAYER**
A. [Primary Relief Requested]
B. [Secondary Relief Requested]
C. [Any other relief as this Hon'ble Court deems fit]

**FILED BY:**
_____________________
Advocate / Applicant

Place: _______
Date: _______
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
    classification = get_case_classification_labels(user_input + " " + case_title, case_type)

    if not eligible:
      return jsonify({
        "eligible":  False,
        "script":    None,
        "videoUrl":  None,
        "lang":      lang,
        "langName":  SUPPORTED_LANGUAGES.get(
          lang,"English"
        ),
        "classification": classification
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
      "classification": classification,
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

@app.route("/triage-case", methods=["POST"])
def triage_case():
  try:
    data = request.json
    user_input = data.get("userInput", "")
    case_type = data.get("caseType", "")
    labels = get_case_classification_labels(user_input, case_type)
    return jsonify(labels)
  except Exception as e:
    return jsonify({"error": str(e)}), 500

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