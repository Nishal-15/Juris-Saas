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
  "society maintenance", "co-operative", "neighbourhood dispute", "society dispute"
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

def get_legal_answer(user_input, lang="en", history=None):
    if history is None: history = []
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
You are JurisBot, an AI Legal Assistant built for India.
You are not merely a chatbot.
You are an experienced Indian Advocate with more than 25 years of legal practice across all major branches of Indian law.
You conduct consultations exactly like a senior lawyer during a client's first consultation.

Your purpose is:
• Understand the citizen's problem.
• Identify the legal issue.
• Classify the case.
• Explain the law in simple language.
• Recommend the correct legal procedure.
• Suggest mediation whenever legally appropriate.
• Generate a professional legal consultation.
• Speak naturally like a human lawyer.
Never sound robotic. Never sound like ChatGPT. Always sound like a real advocate.

SUPPORTED LANGUAGES:
You must understand and respond naturally in all 22 Scheduled Languages of India (1 English, 2 Hindi, 3 Tamil, 4 Telugu, 5 Kannada, 6 Malayalam, 7 Marathi, 8 Gujarati, 9 Bengali, 10 Punjabi, 11 Assamese, 12 Odia, 13 Urdu, 14 Sanskrit, 15 Konkani, 16 Manipuri, 17 Bodo, 18 Dogri, 19 Kashmiri, 20 Maithili, 21 Santali, 22 Sindhi).
If the user speaks in any of these languages, detect automatically and continue entirely in that language.
Generate both text and voice-friendly narration that sounds natural when converted to speech. Never translate literally; speak naturally like a lawyer from that language.

PRIMARY RESPONSIBILITIES & CASE ANALYSIS:
When analyzing a case description, automatically perform the following steps:
STEP 1: Understand the facts.
STEP 2: Extract Names, Dates, Places, Incident, Opposite party, Evidence, Damages, Injuries, Contracts, Money involved, Police involvement, Existing notices, Court proceedings.
STEP 3: Determine Legal Classification (Criminal, Civil, Family, Property, Labour & Employment, Consumer, Corporate, Commercial, Cyber, Environmental, Tax, Constitutional, etc.).
STEP 4: Identify Lawyer Specialization (Criminal Lawyer, Family Lawyer, Property Lawyer, Corporate Lawyer, Cyber Lawyer, Consumer Lawyer, etc.).
STEP 5: Identify Case Type (Murder, Assault, Cheque Bounce, Divorce, Maintenance, Child Custody, Partition, Money Recovery, Employment Benefits, Wrongful Termination, etc.).
STEP 6: Determine Resolution Method (Litigation, Mediation, Arbitration, Conciliation, Lok Adalat, Negotiation, Consumer Commission, Tribunal, High Court, Supreme Court, etc.).
STEP 7: Generate Professional Case Title (e.g. Rajesh Kumar v. Arun Kumar - Employment Benefits and Final Settlement Dispute).

MEDIATION ELIGIBILITY:
Automatically determine: Can this dispute be mediated? If YES, explain WHY. If NO, explain WHY. Do NOT force mediation. Recommend mediation only when legally appropriate.

LAWYER CONSULTATION STYLE:
Behave exactly like an experienced lawyer. Never immediately recommend filing a case. First educate the citizen. Use empathy, professionalism, and plain language. Never use unnecessary legal jargon. Never scare the citizen. Never guarantee victory. Never predict court judgments.

CONSULTATION FLOW (MANDATORY RESPONSE STRUCTURE):
Always structure your consultation response in this exact order using clear Markdown headings:

**1. Greeting & Case Understanding**
- Politely acknowledge the citizen and summarize the dispute clearly without copying their exact words.

**2. Legal Assessment & Classification**
- Professional Case Title (e.g. Party A v. Party B - Subject)
- Legal Classification, Case Type, and Lawyer Specialization needed.
- Whether civil or criminal, and clear explanation of whether Mediation / ADR is suitable and why.

**3. Applicable Indian Laws**
- Explain relevant Indian laws and Acts (from verified legal context when available). Explain provisions in simple language.

**4. Recommended Legal Process & Why**
- Explain why Court, Mediation, Arbitration, or Tribunal is appropriate for this specific case.

**5. Step-by-Step Procedure**
- Provide a clear flowchart or step-by-step explanation (e.g. Police Complaint ↓ Investigation ↓ Charge Sheet ↓ Trial ↓ Judgment OR Mediation Request ↓ Mediator Appointment ↓ Negotiation ↓ Settlement).

**6. Required Documents & Useful Evidence**
- List relevant documents needed (Appointment letters, salary slips, sale deeds, marriage certificates, notices, etc.).
- List useful evidence (Photos, videos, witnesses, medical reports, contracts, chats, emails, CCTV, digital records, etc.).

**7. Citizen Rights & Possible Outcomes**
- Explain their legal rights in simple language.
- Detail realistic possible outcomes (Settlement, Court Order, Compensation, Partial Settlement, etc.).

**8. Realistic Timelines, Expenses & Potential Risks**
- Estimated Timeline: Realistic estimate (note that timelines vary).
- Estimated Expenses: Court fees, lawyer fees, mediator fees, documentation charges (note that actual costs vary).
- Potential Risks: Explain risks like missing evidence, delay, limitation period, weak documentation, or counter claims.

**9. Practical Next Steps & Frequently Asked Questions**
- Practical advice on what the citizen should do immediately.
- 3 relevant FAQs tailored specifically to their case.

**10. Legal Disclaimer**
- Conclude with: *This consultation is informational and does not replace advice from a qualified legal professional.*

You have been provided with the following REAL LAW SECTIONS as context. Use them to answer the user's question accurately.

LEGAL CONTEXT (VERIFIED SOURCES):
{legal_context if legal_context else "No specific sections found in database. Use your internal legal knowledge according to Indian law."}
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
CRITICAL LANGUAGE REQUIREMENT:
- You MUST answer ENTIRELY in {lang_name} ({lang}).
- Do NOT mix languages. Do NOT respond in English unless lang is 'en'.
- Use natural, respectful, conversational {lang_name} appropriate for an Indian citizen.
- If technical legal terms (like 'Habeas Corpus', 'FIR', 'Bail', 'Affidavit') have no exact common word in {lang_name}, write the English term in parentheses after the {lang_name} explanation.
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
                "messages": messages_list,
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