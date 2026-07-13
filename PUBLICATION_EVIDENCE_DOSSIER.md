# JurisBot AI — Publication Evidence Dossier

## 1. Executive Summary
This dossier provides a comprehensive, evidence-based extraction of the JurisBot AI Legal Intelligence Platform, designed to serve as the foundation for a high-quality IEEE/Scopus research paper. It analyzes the architectural, algorithmic, and experimental state of the repository (`e:\Juris-Saas`). The system utilizes a multi-portal MERN stack integrated with a Python Flask AI microservice, WebRTC, and Socket.IO. This document explicitly separates verifiable code-based facts from missing experimental data, outlining a precise roadmap to achieve publication readiness.

---

## 2. Experimental Evidence

### Current Measurable Metrics (Verified in Code)
- **AI Auto-fill Debounce Timer:** 2,500 ms (`frontend/src/components/FilingConsole.jsx`)
- **Video Call Token Expiry (TTL):** 3,600 seconds (1 hour) (`backend/ai-service/app.py`)
- **OTP Expiry Window:** 300 seconds (5 minutes) (`backend/routes/auth.js`)
- **Ollama Fallback Timeout:** 15 seconds (`backend/ai-service/app.py`)
- **Estimated AI Inference Time (Groq):** ~1–3 seconds (Inferred from patent documentation, but lacks dynamic logging).
- **JWT Expiry:** 86,400 seconds (1 day) for citizens, 604,800 seconds (7 days) for lawyers.

### Missing Experimental Data & Instrumentation Recommendations
The repository currently lacks automated benchmark scripts, load testing folders, and performance logs (e.g., no APM tools like New Relic or Datadog). 

| Metric | Status | Recommended Instrumentation / Tooling |
| :--- | :--- | :--- |
| **API Response Time** | UNAVAILABLE | Implement `morgan` logging with response times; use JMeter for REST API load testing. |
| **Database Query Latency** | UNAVAILABLE | Enable MongoDB Atlas Performance Advisor; wrap `checkSubscription` queries in `console.time()`. |
| **Lawyer Matching Time** | UNAVAILABLE | Benchmark the `$regex` query on the `cases.js` creation endpoint using Locust. |
| **WebSocket Latency** | UNAVAILABLE | Use Socket.IO benchmarking tools (e.g., `artillery-engine-socketio`). |
| **WebRTC Connection Time** | UNAVAILABLE | Extract ICE gathering state durations using the `getStats()` WebRTC API in `VideoCall.jsx`. |
| **File Upload Duration** | UNAVAILABLE | Measure Multer stream processing time in `auth.js` and `documents.js`. |

---

## 3. AI Evaluation

### Implementation Details
- **Primary Model:** Groq `llama-3.3-70b-versatile`
- **Fallback Model:** Ollama `mistral` (Local)
- **Hyperparameters:** Temperature: 0.2 (low variance for legal factual accuracy), Max Tokens: 1500.
- **Prompt Engineering Strategy:** Context injection via f-strings. A 60+ category legal taxonomy is injected directly into the system prompt for triage. The `{lang}` parameter is injected dynamically for multilingual support.
- **Output Validation:** JSON parsing for the `analyze-story` endpoint to extract `title`, `category`, and `legalType`.
- **Fallback & Safety:** 
  - Subject filter blocklist (19 keywords) rejects non-legal topics.
  - Multi-engine cascade: Groq → Ollama → Deterministic Heuristic (extracting first 7 words).

### Missing AI Evaluation Data
No formal AI evaluation datasets or metric logs (Accuracy, Precision, Recall, F1-score, Confusion Matrix) exist in the repository.

### Proposed Experimental Methodology
- **Dataset:** Construct a dataset of 1,000 anonymized plain-language legal incident descriptions.
- **Ground Truth:** Have 3 legal professionals manually classify these 1,000 cases into the 60+ taxonomy categories.
- **Evaluation Metrics:** Calculate Precision, Recall, and Macro F1-score for the classification endpoint. Measure BLEU/ROUGE for the generated case titles against the human-written titles.
- **Statistical Validation:** Perform 5-fold cross-validation on the model's responses to measure hallucination variance.

---

## 4. Dataset Analysis

### Current Status
There is **no explicit training dataset** or fine-tuning dataset present in the repository. The AI relies heavily on zero-shot/few-shot prompting using a hardcoded taxonomy array inside the Node.js/Python service.

### Reproducible Dataset Creation Methodology (For Publication)
To publish the AI triage capabilities, a validation dataset must be created:
1. **Source:** Scrape public, anonymized FIR (First Information Report) summaries or legal aid request forums.
2. **Structure:** CSV containing: `[Raw_Incident_Narration, Human_Title, Human_Category, Human_LegalType]`.
3. **Size:** 1,000 - 5,000 samples.
4. **Annotation:** 3 independent legal experts; resolve disagreements via majority vote (Cohen’s Kappa for inter-rater reliability).
5. **Limitations:** Regional bias (focuses purely on Indian Penal Code/Civil laws); language bias (English/transliterated regional languages).

---

## 5. Comparative Study

| Feature | Traditional Legal Workflow | Generic Legal Portals | JurisBot AI (Proposed) | Supported by Code? |
| :--- | :--- | :--- | :--- | :--- |
| **Case Filing** | Manual, paper-based | Manual web forms | AI-guided, 22-language voice input | YES (`FilingConsole.jsx`) |
| **Legal Title Gen** | Requires lawyer | User must know terms | Auto-generated via LLM taxonomy | YES (`analyze-story` API) |
| **Lawyer Matching** | Word of mouth | Simple directory | Specialization Regex + Availability | YES (`cases.js` marketplace) |
| **Consultation** | Physical office | External Zoom/Meet | Integrated WebRTC + Sockets | YES (`VideoCall.jsx`) |
| **Reminders** | Manual calls | Generic SMS | AI-generated Contextual WhatsApp | YES (`scheduler.js`) |
| **Quota Control** | Honor system | Cached counters | Live DB sync on acceptance | YES (`checkSubscription.js`) |

*(Note: While features are supported by code, quantitative time comparisons e.g., "Case filing time reduced by 40%" require user-study experiments.)*

---

## 6. Performance Optimizations

| Optimization | Purpose | Implementation / File Evidence | Benefits |
| :--- | :--- | :--- | :--- |
| **Debouncing** | Prevent API spam during case typing | `setTimeout(handleAIAutoFill, 2500)` in `FilingConsole.jsx` | Reduces LLM API costs; prevents rate limits. |
| **Background Processing** | Non-blocking UI during heavy tasks | `aiVerifier.js` spawned async; Law ingestion via separate OS process | Instant HTTP 200 response to client. |
| **Lazy Evaluation** | Efficient timeline rendering | Embedded `trackingHistory` array in `Case` model | Avoids expensive relational DB `$lookup` joins. |
| **Pre-Paint State UI** | Zero-flicker sidebar | `jurisbot-ui/script.js` uses `--dur: 0s` trick before DOM paint | Eliminates Layout Shifts (CLS metric). |
| **Connection Pooling** | DB efficiency | Mongoose default pool size | Reuses TCP connections to MongoDB Atlas. |

*Unmeasured:* Complexity reduction factors are theoretically sound but lack measured improvement data (e.g., milliseconds saved).

---

## 7. Algorithm Analysis

### 1. AI Triage Algorithm
- **Purpose:** Map free-text to formal legal taxonomy.
- **Input:** String (Description).
- **Flow:** Length Check > Debounce > HTTP to Python > Inject Taxonomy > Groq LLM > Parse JSON > Populate Form.
- **Complexity:** Time: $O(1)$ locally, bound by LLM generation time. Space: $O(1)$.

### 2. Lawyer Matching (Marketplace Filter)
- **Purpose:** Match unassigned cases to lawyer specializations without "keyword bleed".
- **Input:** Lawyer specialization string.
- **Flow:** Split specialization by delimiter > Apply `$or` Regex to case `type` and `title` only (explicitly excluding `description`).
- **Complexity:** Time: $O(N \cdot M)$ where $N$ is unassigned cases and $M$ is keyword count.
- **Optimization:** If results < 5, fallback drops regex and returns all unassigned cases.

### 3. Subscription Enforcement Algorithm
- **Purpose:** Strictly enforce case quotas without race conditions.
- **Flow:** Intercept Accept Request > Query DB for lawyer's active cases since `subscriptionStartedAt` > Sync count > Block if $\ge$ limit.
- **Complexity:** Time: $O(K)$ where $K$ is number of cases matching index.

### 4. Calendar-Day Hearing Countdown
- **Purpose:** Eliminate timezone off-by-one errors.
- **Flow:** Normalize current date to 00:00:00 > Normalize hearing date to 00:00:00 > Subtract > Divide by 86,400,000 > `Math.round()`.

---

## 8. Security Assessment

| Mechanism | Implementation | Strength | Weakness / Missing |
| :--- | :--- | :--- | :--- |
| **JWT & RBAC** | `auth.js` middleware | Checks both Bearer and x-auth-token | No token blacklisting on logout. |
| **Password Hashing** | bcrypt (10 rounds) in Mongoose pre-save | Industry standard | None. |
| **Email Uniqueness** | Checked across both User & Lawyer collections | Prevents role-collision | Done at app-layer, not DB-layer index. |
| **Auth Bypass** | `admin_master_token` string | Easy emergency access | **Critical Security Flaw**: Static secret. |
| **OTP Verification** | `msg91` via `auth.js` | Secures phone numbers | Stored in-memory; lost on server reboot. |
| **File Protection** | Multer sanitization | Prevents path traversal | Uploads stored locally (DoS risk on disk). |

*Missing:* Rate limiting (`express-rate-limit` is in `package.json` but needs strict implementation verification), Helmet for HTTP headers, CSRF tokens.

---

## 9. Scalability Assessment
- **Current Architecture:** Monolithic Node.js server with a microservice Python component.
- **Horizontal Scaling:** **Limited.** Socket.IO relies on in-memory mapping. To scale horizontally, a Redis adapter (`@socket.io/redis-adapter`) must be implemented to sync websocket rooms across multiple server instances.
- **File Storage:** **Limited.** Documents and avatars are stored in local `/uploads/`. A migration to AWS S3/Cloudinary is required for stateless containerization (Docker/K8s).
- **Database:** **Highly Scalable.** MongoDB Atlas handles sharding and replica sets seamlessly.
- **AI Inference:** **Highly Scalable.** Relies on Groq Cloud; python service is entirely stateless.

---

## 10. Reliability Assessment (Fault Tolerance)
- **AI Fallback (Graceful Degradation):** Groq API → Ollama Local → Heuristic Extraction (7-words). Ensures 100% uptime for the triage form even if cloud services fail.
- **Notification Offline Handling:** Chat messages are persisted to MongoDB *before* Socket.IO emission. If a peer is offline, they retrieve history via `GET /chat/:userId` upon reconnection.
- **WhatsApp Simulation:** If Twilio credentials are missing in `.env`, the system logs messages to the console rather than crashing the thread.
- **Payment Simulation:** Handles "fail" keyword in mock payment gateways to test UI exception recovery.

---

## 11. Design Patterns
1. **Middleware Pattern:** Heavily used in Express (`auth`, `checkSubscription`) for request pipeline interception.
2. **Singleton Pattern:** The Socket.IO client instance (`src/api/socket.js`) is initialized once at module load and shared across all React components.
3. **Observer / Pub-Sub Pattern:** Socket.IO architecture for real-time notifications, chat, and "marketplace-needs-refresh" broadcasts.
4. **Adapter Pattern:** The Python AI service acts as an adapter, normalizing inputs for Groq and Ollama APIs.
5. **State Machine:** The Case lifecycle (`Open` → `Pending` → `In Progress` → `Closed`) dictates UI rendering and API access.

---

## 12. Software Engineering Assessment
- **SOLID Principles:** Good adherence to Single Responsibility (React components are heavily decoupled; distinct route files).
- **DRY:** The `axios` interceptor globally handles JWT injection, avoiding redundant auth headers in every API call.
- **Coupling & Cohesion:** Low coupling between the three distinct React apps; high cohesion within the backend route modules.
- **Technical Debt:** 
  - Using local filesystem for uploads.
  - In-memory OTP cache.
  - Lack of comprehensive Unit/Integration tests (Jest/Mocha).

---

## 13. Publication Figures

The following figures must be generated for the manuscript:
1. **System Architecture Diagram (Network):** Shows 3 React portals, Node monolith, Python microservice, and MongoDB. *(Can be auto-generated)*
2. **Sequence Diagram - Case Filing Flow:** Citizen $\to$ Node $\to$ Python $\to$ Groq $\to$ DB $\to$ WebSocket Broadcast. *(Can be auto-generated)*
3. **Sequence Diagram - WebRTC Pipeline:** Caller $\to$ Token Fetch $\to$ Socket Signaling (Offer/Answer/ICE) $\to$ Peer Connection. *(Can be auto-generated)*
4. **State Diagram - Case Lifecycle:** Transitions between Open, Pending Expert, In Progress, Closed. *(Can be auto-generated)*
5. **ER Diagram - Database Schema:** Dual-collections (`users`, `lawyers`) linked to `cases` with embedded `trackingHistory`. *(Can be auto-generated)*
6. **Activity Diagram - Lawyer Matching & Quota Sync:** Flowchart of regex matching and middleware quota counting.

---

## 14. Publication Tables
1. **Technology Stack Summary** (Tools, versions, purposes).
2. **API Endpoint Summary** (Route, Method, Auth Level, Purpose).
3. **AI Fallback Cascade** (Groq vs Ollama vs Heuristic metrics).
4. **Algorithm Complexity Analysis** (Time/Space complexities for matching and quota sync).
5. **Feature Comparison** (JurisBot vs Traditional Systems).
6. **Experimental Performance Metrics** (Requires JMeter/Locust data collection).

---

## 15. Research Contributions & Novelty Analysis

| Contribution | Innovation & Technical Implementation | Novelty (1-10) | Patentability |
| :--- | :--- | :--- | :--- |
| **AI-Triggered Legal Auto-Fill** | Debounce-triggered LLM pipeline injecting a 60+ taxonomy to generate formal court titles from plain text. | **8.5** | HIGH |
| **Two-Phase Auditable Protocol** | "Pending Expert Acceptance" state creates a legally significant, timestamped pre-engagement record via WebSockets. | **7.5** | MED |
| **Contextual AI WhatsApp Alerts** | Cron + LLM pipeline generating unique, temporal-aware hearing reminders sent via Twilio to both parties. | **8.0** | HIGH |
| **Live Quota Sync Middleware** | Recomputing limits from authoritative DB on every accept request to eliminate distributed cache race conditions. | **6.5** | MED |
| **Midnight-Normalized Countdown** | Explicitly stripping time down to 00:00:00 to solve sub-day off-by-one errors in legal software. | **6.0** | LOW |
| **Description-Excluded Filtering** | Restricting regex marketplace searches to `title/type` to prevent "keyword bleed" from incident narratives. | **7.0** | MED |

---

## 16. Threats to Validity
- **Internal Validity:** Lack of automated unit tests means the debounce timing or quota sync could fail under undocumented edge cases.
- **External Validity:** The AI taxonomy and matching logic are strictly optimized for the Indian Legal System. Transferability to US/EU law requires modifying the taxonomy prompt.
- **Construct Validity:** The heuristic fallback (extracting 7 words) may not represent a valid "legal title" in court, degrading the construct of the feature.
- **Dataset Bias:** The LLM's inherent training data bias may affect how it classifies incidents written in transliterated regional languages.

---

## 17. Limitations & Future Work
- **Limitations:** No End-to-End Encryption (E2EE) on chat; Socket.IO requires sticky sessions to scale; local file storage prevents stateless scaling.
- **Short-term Work:** Implement Redis for Socket.IO adapter and OTP caching. Migrate file uploads to AWS S3.
- **Medium-term Work:** Build an empirical AI validation dataset. Implement Rate Limiting and Helmet for API security.
- **Long-term Research:** Integrate Retrieval-Augmented Generation (RAG) using FAISS over actual Indian Penal Code PDFs (as hinted in admin portal features) to provide cited legal precedent to the lawyer dashboard.

---

## 18. Missing Evidence Checklist (Action Required)

| Missing Item | Why it's important | Recommended Tool | Priority |
| :--- | :--- | :--- | :--- |
| **Load Testing Metrics** | Proves architecture can scale | JMeter / Locust | **HIGH** |
| **AI Accuracy Metrics (F1)** | Validates the core AI contribution | Python `scikit-learn` on ground-truth dataset | **HIGH** |
| **Socket Latency Logs** | Proves real-time feasibility | Artillery.io | MED |
| **Database Latency Logs** | Proves quota sync doesn't bottleneck | MongoDB Atlas Profiler | MED |
| **Usability Study** | Proves voice-input effectively aids citizens | User Surveys (Likert scale) | LOW |

---

## 19. File-Level Evidence Mapping

| Claim / Contribution | Supporting File | Relevant Function / Implementation Detail |
| :--- | :--- | :--- |
| AI Auto-Fill Debounce | `frontend/src/components/FilingConsole.jsx` | `setTimeout(handleAIAutoFill, 2500)` triggered by `onChange`. |
| AI Taxonomy Inference | `backend/ai-service/app.py` | `POST /chat` mapping inputs against Groq `llama-3.3-70b-versatile`. |
| Live Quota Sync | `backend/middleware/checkSubscription.js` | Middleware intercepts `/accept/:id`, calls `Case.countDocuments`. |
| Two-Phase Protocol | `backend/routes/cases.js` | `/connect/:caseId/:lawyerId` sets status to "Pending Expert Acceptance". |
| Midnight Normalization | `frontend/src/components/CaseDetails.jsx` | `today.setHours(0,0,0,0); hearing.setHours(0,0,0,0);` |
| Timeline Sorting | `frontend/src/components/CaseDetails.jsx` | Merges `createdAt` with `trackingHistory` array, sorts by date. |
| AI WhatsApp Cron | `backend/scheduler.js` | `node-cron` scheduled at `0 8 * * *`, filters by `hearingDate`. |
| WebRTC Signaling | `frontend/src/components/VideoCall.jsx` | PeerConnection handshake via Socket.IO events (`offer`, `answer`). |

---

## 20. Overall IEEE/Scopus Readiness Score: 75%
**Justification:** The project possesses an exceptionally strong architectural foundation, novel feature combinations (LLM + Sockets + Cron), and high-quality implementation evidence. The 25% gap to publication readiness is entirely due to the absence of empirical datasets, load testing metrics, and statistical validation (F1 scores). Once the *Missing Evidence Checklist* is completed, this system will form the basis of a highly competitive Q1 journal submission in the field of LawTech and Applied AI.
