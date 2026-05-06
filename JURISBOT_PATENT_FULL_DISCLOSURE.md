# JURISBOT AI — UNIFIED PATENT TECHNICAL DISCLOSURE

## 1. ABSTRACT
A computer-implemented legal intelligence platform providing automated legal case filing, AI-augmented triage, and real-time legal advocacy matching. The system comprises a multi-portal architecture (Citizen, Lawyer, Admin) communicating with a centralized Node.js backend and a specialized Python AI service. Key innovations include: (a) an AI-triggered auto-fill mechanism that converts plain-language incident descriptions into formal court-ready case titles using a domain-specific legal taxonomy; (b) a two-phase lawyer-citizen engagement protocol with an auditable "Pending Expert Acceptance" state; (c) a live-syncing subscription quota enforcement middleware; and (d) a calendar-normalized hearing countdown algorithm. The platform integrates real-time Socket.IO communication, WebRTC video consultations, and automated AI-generated WhatsApp hearing reminders delivered via a daily scheduled cron process.

## 2. TECHNICAL FIELD
The present invention relates generally to the field of legal technology (LawTech) and software-as-a-service (SaaS) platforms. More specifically, the invention relates to systems and methods for automated legal case management, AI-driven legal classification, and real-time legal consultation orchestration.

## 3. BACKGROUND OF INVENTION
### 3.1 Existing Systems
Traditional legal systems and existing legal-tech platforms often rely on manual data entry, physical documentation, or simple directory-based matching of clients with lawyers. Digital case filing systems, where they exist, typically require users to possess a high degree of legal literacy to correctly categorize and title their cases.

### 3.2 Limitations
1. **Legal Literacy Gap:** Citizens often struggle to formulate formal legal case titles, leading to administrative delays and errors in filing.
2. **Lack of Auditable Engagement:** Existing platforms often lack a structured, immutable record of the pre-engagement phase between a client and a lawyer.
3. **Inefficient Notifications:** Hearing reminders are frequently delivered via generic, easily-ignored SMS templates or manual follow-ups.
4. **Quota Exploitation:** Subscription-based marketplaces often use cached usage counters, leading to race conditions and quota abuse.
5. **Timezone Inaccuracy:** Countdown timers for court hearings often produce off-by-one errors due to naive timestamp subtraction near midnight boundaries.

### 3.3 Problem Statement
There is a need for a legal intelligence platform that automates the transition from plain-language incident narration to formal legal documentation, ensures an auditable engagement chain, and provides highly accurate, personalized, and context-aware reminders to all parties involved.

## 4. SUMMARY OF INVENTION
The present invention, JurisBot AI, provides a unified legal intelligence platform designed to bridge the gap between citizens and the legal system. The system employs a multi-engine AI cascade (Cloud LLM → Local LLM → Heuristic) to perform real-time triage and classification. A robust Node.js backend manages case lifecycles, while a Python-based AI service handles complex NLP tasks and media signaling. The platform incorporates a unique two-phase handshake for lawyer-client connections and a daily scheduled automation service that generates personalized hearing alerts.

## 5. BRIEF DESCRIPTION OF DRAWINGS
- **FIG.1: System Architecture** — Illustrates the interaction between the frontend portals, backend monolith, AI service, and database.
- **FIG.2: Case Filing Flow** — Details the multi-step wizard, AI auto-fill triggers, and lawyer matching logic.
- **FIG.3: Lawyer Interaction Flow** — Shows the engagement lifecycle from connection request to formal acceptance.
- **FIG.4: AI Processing Pipeline** — Outlines the data flow from user input to Groq/LLM processing and formal taxonomy mapping.
- **FIG.5: Notification & Communication System** — Displays the WebSocket, WhatsApp, and Persistent Notification architecture.
- **FIG.6: Video Call System** — Visualizes the WebRTC signaling and Agora token generation lifecycle.

## 6. DETAILED DESCRIPTION OF THE INVENTION

### 6.1 System Architecture
The system is constructed as a distributed architecture comprising four primary layers:
1.  **Frontend Layer:** Three isolated React/Vite applications (Citizen Portal, Lawyer Portal, Admin Portal) and a standalone Vanilla JS UI.
2.  **Backend Layer:** A Node.js Express monolith (Server.js) handling business logic, authentication, and real-time communication via Socket.IO.
3.  **AI Service Layer:** A Python Flask application (App.py) providing specialized NLP endpoints and Agora media token generation.
4.  **Data & Storage Layer:** A MongoDB database (via Mongoose) and a local filesystem for document storage.

### 6.2 Component-Level Breakdown
-   **Citizen Portal:** Implements the AI-Guided Case Filing Wizard with Web Speech API integration for multilingual voice input (22 Indian languages).
-   **Lawyer Portal:** Features a mission-control dashboard with a pending queue for requests and an active workspace for accepted cases.
-   **Admin Portal:** Provides a lawyer verification queue and a law document ingestion pipeline.
-   **Middleware:** Includes an authentication layer supporting JWT and a `checkSubscription` gate that enforces case limits in real-time.
-   **Background Services:** Features a `node-cron` scheduler for daily hearing alerts and an asynchronous AI-driven lawyer verification worker.

### 6.3 Low-Level Feature Execution
#### 6.3.1 AI Case Title Auto-Fill
The system monitors user input in the case description field. A debounce mechanism (2,500ms) or a field blur event triggers an asynchronous POST request to the `/analyze-story` endpoint. The backend invokes a Large Language Model (LLM) with a domain-specific legal taxonomy. The result—a formal court title, category, and legal type—is returned and automatically populates the form, while a "SMART GEN" badge indicates AI-assisted generation.

#### 6.3.2 Lawyer Matching & Connection
Upon case filing, the server executes a regex-based query on the `Lawyers` collection, matching the case's `legalType` against lawyer specializations. Top-ranked advocates are presented to the citizen. When a citizen selects an advocate, the case state transitions to "Pending Expert Acceptance," and a targeted WebSocket event is dispatched to the lawyer's private room.

### 6.4 State Machines
#### 6.4.1 Case Lifecycle
[OPEN] → [Connection Requested] → [PENDING EXPERT ACCEPTANCE] → [Lawyer Accepted] → [IN PROGRESS] → [HEARING SCHEDULED] → [VERDICT PENDING] → [CLOSED].

#### 6.4.2 Lawyer Subscription Lifecycle
[TRIAL] → [ACTIVE] → [QUOTA REACHED] → [UPGRADE REQUESTED] → [RENEWED]. Quotas are recomputed live on every case-acceptance request.

#### 6.4.3 Lawyer Verification
[UNVERIFIED] → [CERTIFICATE UPLOADED] → [PENDING REVIEW] → [VERIFIED/REJECTED].

### 6.5 System Sequence Flows
-   **Case Filing:** Wizard Step 1 (Category) → Step 2 (Narration + AI Auto-fill) → Step 3 (Evidence) → Step 4 (Finalize) → Matched Lawyers Modal → Connect Request.
-   **Lawyer Acceptance:** Dashboard Refresh → Pending Queue View → Subscription Gate Check → Status Update → Multi-channel Notification (Socket + WhatsApp).
-   **Video Call:** Token Fetch → Signaling Request → Incoming Notification → Handshake (Offer/Answer/ICE) → RTC Stream Establishment → Media Cleanup.

### 6.6 Data Flow Pipelines
1.  **AI Pipeline:** Input String → Python Service → Groq Cloud (LLM) → JSON Extraction → Frontend State Update.
2.  **Notification Pipeline:** Case Update Event → Database Record → Socket.IO Emit → Python Alert Generation → Twilio WhatsApp API.

### 6.7 Network & Device Interaction
-   **WebSocket Lifecycle:** Handlers for `join` (private rooms), `join-room` (shared consult rooms), and `send-message` with DB persistence.
-   **WebRTC:** Uses Google STUN servers for NAT traversal; media tracks (camera/mic) are explicitly stopped upon `end-call` to ensure hardware release.
-   **Mobile Integration:** Capacitor-ready configuration for cross-platform deployment.

### 6.8 Core Algorithms
-   **AI Triage:** Maps free-text to 60+ formal legal case types.
-   **Subscription Enforcement:** Recomputes `casesClaimedCount` live from the `Cases` collection within the current billing window, preventing race-condition bypasses.
-   **Hearing Countdown:** Normalizes both current date and hearing date to midnight (00:00:00.000) before calculating the difference in days, ensuring calendar accuracy.

### 6.9 Edge Cases & Fail-Safes
-   **AI Fallback:** Cloud LLM failure triggers a cascade to a local Ollama instance, then to a deterministic 7-word heuristic extraction.
-   **Auth Security:** Hybrid login checks across multiple collections; static master token bypass for emergency admin access.
-   **Marketplace Fallback:** If filtered specialization results are < 5, the system automatically expands the query to all unassigned cases.

### 6.10 Alternative Implementations
-   **Communication:** WebRTC Data Channels as a low-latency alternative to Socket.IO.
-   **Storage:** AWS S3 for document storage in high-volume deployments instead of local disk storage.
-   **AI Models:** Integration with OpenAI (GPT-4) or Anthropic (Claude) via modular adapter pattern.

## 7. CLAIMS SECTION (REFINED)

### 7.1 Independent System Claims
**Claim 1:** A multi-portal legal intelligence system comprising:
- a citizen interface configured to receive plain-language incident narration;
- an AI classification module configured to analyze said narration and generate a formal legal title based on a domain-specific legal taxonomy;
- a backend server maintaining a persistent audit trail of case milestones;
- a legal expert marketplace configured to filter advocates based on regex matching of specializations against case types;
- and a notification engine configured to deliver synchronized real-time WebSocket events and AI-generated mobile messaging alerts.

### 7.2 Independent Method Claims
**Claim 2:** A method for automated legal case triage comprising:
- detecting a user input pause via a debounce timer;
- transmitting the input string to a remote large language model (LLM);
- receiving a structured JSON response containing a formal court-recognized title and a legal category;
- automatically populating a case filing form with the received values;
- and displaying a visual indicator signifying AI-assisted data generation.

**Claim 3:** A method for auditable lawyer-citizen engagement comprising:
- transitioning a legal case record to an intermediate "Pending Expert Acceptance" state upon a citizen connection request;
- recording the transition with a timestamp in a tracking history array;
- preventing the lawyer from accepting the case if a live-computed subscription quota is exceeded;
- and transitioning the record to an "In Progress" state upon formal lawyer acceptance.

### 7.3 Dependent Claims
**Claim 4:** The system of Claim 1, wherein the hearing countdown algorithm normalizes both the current timestamp and the target hearing date to midnight of their respective calendar days before subtraction to ensure day-level accuracy.
**Claim 5:** The system of Claim 1, wherein the AI classification module utilizes a priority cascade starting with a primary cloud-based LLM and falling back to a locally-hosted LLM upon communication failure.
**Claim 6:** The method of Claim 2, wherein the voice input for case filing is captured using the Web Speech API and configured to support 22 distinct regional languages.
**Claim 7:** The system of Claim 1, further comprising a video signaling module that generates Agora RTC tokens with a predetermined time-to-live (TTL).
**Claim 8:** The system of Claim 1, wherein the sidebar state is persisted in local storage and restored via a zero-duration CSS transition to prevent visual flicker during page load.
**Claim 9:** The method of Claim 3, wherein the tracking history array is stored as an embedded sub-document within the case record, and wherein each entry in the array comprises a status string and a machine-readable timestamp.
**Claim 10:** The system of Claim 1, wherein the notification engine utilizes a daily cron process to scan the database for impending hearings and triggers the Python AI service to generate case-specific reminder text.
**Claim 11:** The method of Claim 2, wherein the debounce timer is set to 2,500 milliseconds and is reset upon each detected character input in the incident narration field.
**Claim 12:** The system of Claim 1, wherein the lawyer marketplace ranks advocates based on a composite score of specialization relevance, years of experience, and user-provided ratings.
**Claim 13:** The method of Claim 3, wherein the subscription quota enforcement recomputes the case count within the current billing cycle by filtering the case database by the advocate's unique identifier and the subscription start timestamp.

### 7.4 Narrow Technical Claims
**Claim 14 — Multi-Collection Authentication:** An authentication method querying a role-specific database collection and enforcing email uniqueness across all platform roles at the application layer.
**Claim 15 — Contextual Marketplace Filtering:** A marketplace filtering method that explicitly excludes description fields from keyword regex matching to prevent false positives from incidental legal terminology.
**Claim 16 — Zero-Flicker Pre-Paint Restoration:** A sidebar state restoration method that disables CSS transitions temporarily during the initial render to prevent visible state-jumping animations upon page refresh.
**Claim 17 — Background Process Ingestion:** A document ingestion method that spawns a non-blocking background OS process to index PDF documents into a vector-searchable knowledge base while returning an immediate HTTP success response.


## 8. NOVELTY AND INVENTIVE STEP
### 8.1 Non-Obviousness
The present invention is non-obvious as it combines real-time AI-assisted drafting of formal legal documents with a strict, auditable multi-phase engagement protocol. Unlike prior art that uses generic reminders, the invention employs a context-aware LLM to generate individualized alerts for each hearing, delivered simultaneously to all parties.

### 8.2 Technical Advantages
- **Reduced Error Rate:** AI auto-fill ensures case titles align with court terminology.
- **Auditable Integrity:** The "Pending Expert Acceptance" state provides a legally significant timestamp in the pre-engagement phase.
- **Accurate Countdown:** Midnight normalization eliminates timezone and sub-day calculation errors.
- **Live Quota Sync:** Real-time DB-based counting prevents subscription abuse in high-concurrency environments.

## 9. INDUSTRIAL APPLICABILITY
The JurisBot AI platform is highly scalable and suitable for deployment as a national-level legal infrastructure. It is designed to operate on commodity hardware (cloud or on-premise) and integrates with standard messaging APIs (Twilio, MSG91) and payment gateways. The modular AI architecture allows for continuous updates as legal taxonomies and language models evolve.

---
*END OF DOCUMENT*
