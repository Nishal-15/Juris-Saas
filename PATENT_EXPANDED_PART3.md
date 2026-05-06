# JURISBOT AI — PATENT TECHNICAL DISCLOSURE
## Part 3: Formal Sequence Flows, Extended Claims & Novelty Analysis
## (Additive only — does not repeat Parts 1 or 2)

---

## A. FORMAL SYSTEM SEQUENCE FLOWS

### A.1 Case Filing — Complete Sequence

```
ACTOR: Citizen Browser
ACTOR: Node.js Server (:5000)
ACTOR: MongoDB
ACTOR: Groq Cloud API
ACTOR: Lawyer Browser(s) [0..N]

Step 1 — Language Selection
  Citizen → selects one of 22 Indian language options
  State: selectedLang = { code: "ta-IN", name: "Tamil", flag: "🇮🇳" }

Step 2 — Category Selection (Wizard Step 1)
  Citizen → clicks one of 5 category cards
  State: formData.category = "Family Matters"
  UI: "Continue to Narration →" button becomes enabled

Step 3 — Incident Narration (Wizard Step 2)
  Citizen → types incident text (min 20 chars to trigger AI)
  Timer: 2500ms debounce starts on each keystroke
  
Step 4 — AI Auto-Fill Trigger
  [Timer fires OR textarea loses focus]
  Citizen → Node.js: POST /api/cases/analyze-story
    payload: { description: "..." }
  Node.js → Groq: POST /chat/completions
    model: llama-3.3-70b-versatile, temp: 0.2
  Groq → Node.js: { choices[0].message.content: JSON string }
  Node.js → Citizen: { title, category, legalType }
  UI: title field auto-populated; "SMART GEN" badge shown
  UI: container.classList → adds "glow" during analysis

Step 5 — Date & Adversary (Wizard Step 2 continued)
  Citizen → clicks date trigger div → MaterialDatePicker renders
  Citizen → selects date → formData.incidentDate = "YYYY-MM-DD"
  Citizen → types oppositeParty name (optional)

Step 6 — Evidence Upload (Wizard Step 3)
  Citizen → clicks upload zone → <input type="file" multiple> triggered
  Files selected → stored in component state (NOT uploaded yet)

Step 7 — Review & Submit (Wizard Step 4)
  Citizen → reviews all fields in read-only review card
  Citizen → clicks "FINALIZE & FILE CASE"
  Validation: title, description, category, incidentDate all non-empty
  Citizen → Node.js: POST /api/cases
    payload: { title, description, category, legalType, incidentDate, urgency, oppositeParty }
    header: Authorization: Bearer <jwt>
  
Step 8 — Server Processing
  Node.js: JWT middleware → decodes userId from token
  Node.js → MongoDB: Case.create({ user: userId, assignedLawyer: null, status: "Open", ... })
  MongoDB → Node.js: saved case document with _id
  Node.js → MongoDB: Lawyer.find({ specialization: regex(legalType) }).limit(3)
  MongoDB → Node.js: up to 3 matching lawyer documents
  Node.js → Socket.IO: io.emit("marketplace-needs-refresh")

Step 9 — Marketplace Refresh (parallel)
  Socket.IO → Lawyer Browser(s): "marketplace-needs-refresh" event
  Each Lawyer Browser: re-fetches GET /api/cases/open
  Each Lawyer Dashboard: open cases list updates

Step 10 — Success Modal
  Node.js → Citizen Browser: { case: {...}, suggestedLawyers: [...] }
  UI: setShowSuccessModal(true)
  UI: matched lawyers rendered with Connect buttons
  
Step 11 — Connect to Lawyer
  Citizen → clicks "Connect" on lawyer card
  Citizen → Node.js: POST /api/cases/connect/:caseId/:lawyerId
  Node.js → MongoDB: Case.findByIdAndUpdate(caseId,
    { assignedLawyer: lawyerId, status: "Pending Expert Acceptance",
      $push: { trackingHistory: { status: "Connection Requested", date: now } } })
  Node.js → MongoDB: Notification.create({ user: lawyerId, ... })
  Node.js → Socket.IO: io.to(lawyerId).emit("notification", {...})
  Node.js → Socket.IO: io.emit("marketplace-needs-refresh")
  Lawyer Browser: notification received → audio chime plays
  Citizen Browser: setTimeout 2000ms → navigate("/cases")
```

---

### A.2 Lawyer Case Acceptance — Sequence

```
ACTOR: Lawyer Browser
ACTOR: Node.js Server
ACTOR: checkSubscription Middleware
ACTOR: MongoDB
ACTOR: Python AI Service (:8088)
ACTOR: Twilio API
ACTOR: Citizen Browser

Step 1 — Dashboard Mount
  Lawyer Browser → Node.js: GET /api/analytics/lawyer (stats + subscription)
  Lawyer Browser → Node.js: GET /api/appointments/received
  Lawyer Browser → Node.js: GET /api/cases/open
  Lawyer Browser → Node.js: GET /api/cases/requested
  Lawyer Browser → Node.js: GET /api/cases/my
  [All 5 requests in Promise.all — parallel]
  Node.js → MongoDB: 5 parallel queries
  Results merged in client to build pendingQueue and activeWorkspace arrays

Step 2 — Request Visible in Queue
  LawyerDashboard: pending array contains case with itemType = "case_request"
  UI renders: citizen name, date, case title, "Accept" button

Step 3 — Accept Action
  Lawyer → clicks "Accept"
  Lawyer Browser → Node.js: POST /api/cases/accept/:caseId
    header: Authorization: Bearer <lawyer_jwt>

Step 4 — Subscription Gate
  checkSubscription middleware executes:
    → MongoDB: Lawyer.findById(lawyerId) → get subscriptionTier, caseLimit, subscriptionStartedAt
    → MongoDB: Case.countDocuments({ assignedLawyer: lawyerId, createdAt: { $gte: startAt } })
    → MongoDB: Lawyer.findByIdAndUpdate({ casesClaimedCount: count })
    If count >= caseLimit AND caseLimit !== 9999:
      → return 403 { message: "Subscription limit reached" }
      Lawyer Browser: upgrade modal shown
    Else: next() → route handler executes

Step 5 — Case Record Update
  Node.js → MongoDB: Case.findByIdAndUpdate(caseId,
    { status: "In Progress",
      $push: { trackingHistory: { status: "Lawyer Accepted", date: now } } },
    { new: true }).populate("user", "name")

Step 6 — Citizen Notification (multi-channel)
  Node.js → MongoDB: Notification.create({ user: citizenId, title: "Request Accepted", ... })
  Node.js → Socket.IO: io.to(citizenId).emit("notification",
    { text: "Your expert has accepted the case!", type: "case_accepted" })
  Node.js → MongoDB: User.findById(citizenId) → get phone number
  Node.js → Python AI Service: POST /chat
    { message: "Write 1-sentence WhatsApp alert for [name] re case [title]...", userName }
  Python AI → Groq: inference
  Python AI → Node.js: { answer: "Your case has been accepted by..." }
  Node.js → Twilio API: messages.create({ from: whatsapp:+14155238886, to: whatsapp:+91XXXXXXXXXX, body })

Step 7 — UI Updates
  Citizen Browser (if online): socket.on("notification") → audio chime → notification badge increments
  Citizen CaseDetails page: refetch → timeline shows "Lawyer Accepted" milestone
  Lawyer Dashboard: case moves from pendingQueue to activeWorkspace
```

---

### A.3 Case Update Flow — Sequence

```
ACTOR: Lawyer Browser (CaseDetails page)
ACTOR: Node.js Server
ACTOR: MongoDB
ACTOR: Python AI Service
ACTOR: Twilio
ACTOR: Citizen Browser

Step 1 — Lawyer Opens Case
  Lawyer → Node.js: GET /api/cases/details/:id
  Authorization check: isAssigned === true → access granted
  Node.js → MongoDB: Case.findById.populate("user", "name").populate("assignedLawyer", "name")

Step 2 — Lawyer Fills Update Form
  Fields available: status dropdown, hearingDate, courtLocation, updateNote, nextSteps, verdict
  
Step 3 — Submit Update
  Lawyer → Node.js: PATCH /api/cases/:id/management
    payload: { status, hearingDate, courtLocation, updateNote, nextSteps, verdict }

Step 4 — Server Processing
  Node.js → MongoDB: Case.findOne({ _id, assignedLawyer: lawyerId }).populate("user", "name")
  Apply updates:
    if status → case.status = status
    if hearingDate → case.hearingDate = hearingDate
    if courtLocation → case.courtLocation = courtLocation
    if nextSteps → case.nextSteps = nextSteps
    if verdict → case.verdict = verdict
    if updateNote → case.trackingHistory.push({ status: updateNote, date: new Date() })
  await case.save()

Step 5 — Citizen Real-Time Push
  Node.js → Socket.IO: io.to(citizenId).emit("notification",
    { text: `Case Update: "${title}" — ${updateNote || status}` })

Step 6 — WhatsApp Alert
  Node.js → User.findById(citizenId) → phone
  Node.js → Python AI: POST /chat { message: "Write alert for case_update context...", userName }
  Python AI → Groq → Node.js → Twilio → Citizen WhatsApp

Step 7 — Citizen UI Response
  Citizen CaseDetails: socket notification triggers refetch
  Timeline: new milestone appended at correct chronological position
  Hearing banner: recomputed with new hearingDate
  Status badge: updated color and label
```

---

### A.4 Daily Hearing Notification — Sequence

```
ACTOR: node-cron (server internal)
ACTOR: MongoDB
ACTOR: Python AI Service
ACTOR: Twilio API

Step 1 — Cron Fires (08:00 daily)
  node-cron executes handler

Step 2 — Date Computation
  today = new Date()
  after48h = new Date(); after48h.setDate(today.getDate() + 2)
  todayStr = today.toISOString().split("T")[0]
  after48hStr = after48h.toISOString().split("T")[0]

Step 3 — Case Query
  MongoDB: Case.find({
    hearingDate: { $in: [todayStr, after48hStr] },
    status: "In Progress"
  }).populate("user assignedLawyer")
  Result: array of case documents with citizen and lawyer sub-documents

Step 4 — Per-Case Processing (sequential)
  For each case c:
    isToday = (c.hearingDate === todayStr)
    
    Prompt (isToday=true):
      "Write a 1-sentence professional legal reminder for a client whose
       court hearing is TODAY for case: '{title}'. Be professional and encouraging."
    
    Prompt (isToday=false):
      "Write a 1-sentence legal reminder for a client who has a hearing
       in 48 hours for case: '{title}'. Remind them to be prepared."

Step 5 — AI Message Generation
  Node.js → Python AI: POST /chat { message: prompt, userName: citizen.name }
  Python AI → Groq → Python AI → Node.js: { answer: "..." }
  On timeout/error:
    Fallback (today): "COURT DAY: Your hearing for case '{title}' is scheduled for TODAY."
    Fallback (48h): "REMINDER: You have a legal hearing in 48 hours for case '{title}'."

Step 6 — WhatsApp Dispatch
  For lawyer: sendWhatsApp(assignedLawyer.phone, aiMessage)
  For citizen: sendWhatsApp(user.phone, aiMessage)
  Phone normalization: if !startsWith("+") → prepend "+91"
  Twilio: client.messages.create({ from: whatsapp:+14155238886, to: whatsapp:+91XXXXXXXXXX, body })
  On Twilio error: console.error, continue to next case
```

---

### A.5 Video Call Initiation — Sequence

```
ACTOR: Caller Browser (Citizen or Lawyer)
ACTOR: Node.js Socket.IO Server
ACTOR: Callee Browser
ACTOR: Python AI Service (Agora token)
ACTOR: Agora TURN/STUN servers
ACTOR: Camera/Microphone hardware

Step 1 — Pre-Call Token Fetch
  Caller Browser → Python AI: GET /generate-token?channel_name={roomId}&uid={callerId}
  Python AI: RtcTokenBuilder.buildTokenWithUid(APP_ID, CERT, channel, uid, role=1, expiry=now+3600)
  Python AI → Caller: { token, channel, uid }

Step 2 — Initiate Call Signal
  Caller Browser → Node.js Socket: emit("video-call-request",
    { to: calleeId, from: callerId, fromName: "Nishal", roomId: "room_abc123" })

Step 3 — Signal Relay
  Node.js Socket: io.to(calleeId).emit("incoming-video-call",
    { from: callerId, fromName: "Nishal", roomId: "room_abc123" })

Step 4 — Callee UI Response
  GlobalCallNotification component renders (fixed overlay)
  Displays: caller name + "Accept" / "Reject" buttons
  Audio: iPhone ringtone plays (iphone_orginal.mp3 from root)

Step 5a — Callee Accepts
  Callee Browser → Python AI: GET /generate-token?channel_name={roomId}&uid={calleeId}
  Callee Browser → Node.js Socket: emit("join-room", roomId)
  Callee Browser: navigate to /video-call?room={roomId}

Step 5b — Callee Rejects
  Callee: dismisses overlay; no socket event sent
  Caller: UI waits (no auto-cancel; caller must manually end)

Step 6 — Room Join
  Caller Browser → Node.js Socket: emit("join-room", roomId)
  Node.js: socket.join(roomId)
  Node.js: socket.to(roomId).emit("user-joined") → to all others in room

Step 7 — Media Acquisition
  Both browsers: navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  → Returns MediaStream
  → Assigned to <video> element (muted for self-preview)
  → stream.getTracks() added to RTCPeerConnection via pc.addTrack()

Step 8 — WebRTC Handshake
  Peer A (receives "user-joined"):
    pc.createOffer() → setLocalDescription(offer)
    emit("offer", { room: roomId, sdp: offer })
  
  Node.js: socket.to(room).emit("offer", data)
  
  Peer B:
    setRemoteDescription(offer)
    pc.createAnswer() → setLocalDescription(answer)
    emit("answer", { room: roomId, sdp: answer })
  
  Node.js: socket.to(room).emit("answer", data)
  
  Peer A: setRemoteDescription(answer)

Step 9 — ICE Candidate Exchange
  Both peers: pc.onicecandidate = (e) → emit("ice-candidate", { room, candidate: e.candidate })
  Node.js: socket.to(room).emit("ice-candidate", data)
  Both peers: pc.addIceCandidate(candidate)
  STUN servers (Google): stun.l.google.com:19302 used for NAT traversal

Step 10 — Media Connected
  Both peers: pc.ontrack = (e) → assign e.streams[0] to remote <video>.srcObject
  Video feeds active on both sides

Step 11 — Call Termination
  Either party clicks "End Call":
    emit("end-call", roomId)
  Node.js: socket.to(room).emit("end-call")
  Both browsers:
    localStream.getTracks().forEach(t => t.stop())  ← releases camera LED
    pc.close()
    navigate back to dashboard
```

---

## B. EXTENDED PATENT CLAIM SET

### B.1 Independent System Claims (New — not in Part 2)

**Claim 14 — Dual-Collection Hybrid Authentication System**
A computer-implemented authentication system for a multi-role legal services platform comprising:
- a first database collection storing records for citizen users with fields including name, email, hashed password, phone number, preferred language, and account status;
- a second database collection storing records for legal advocate users with fields including name, email, hashed password, bar identification number, certificate file reference, specialization, subscription tier, subscription expiry, case quota, and verification status;
- a login endpoint configured to: receive an email address, password, and role indicator; dynamically select the appropriate collection based on the role indicator; query the selected collection using the normalized email address; and compare the submitted password against the stored hash using a one-way cryptographic function;
- a user resolution endpoint configured to query both collections sequentially by identifier to return user metadata regardless of collection;
- wherein a cross-collection email uniqueness constraint is enforced at application layer by querying both collections before creating any new user record.

**Claim 15 — Contextual AI Prompt Routing System**
A natural language processing routing system for a legal AI assistant comprising:
- a subject filter module configured to reject queries containing terms from a predefined non-legal category list using case-insensitive substring matching;
- a greeting detection module configured to identify casual salutations using exact string matching against a predefined set of greeting phrases and return a randomized contextual welcome response;
- a notification detection module configured to identify notification-generation requests using substring matching against notification-indicator terms and apply a concise single-sentence output instruction;
- a legal query processing module configured to apply a structured legal response format instruction to all remaining queries, wherein the format instruction specifies: a direct plain-language answer, a bullet-point understanding section, a legal reference section, a practical insight section, and a real-life example;
- a language injection mechanism configured to insert a target language identifier into the processing instruction to support multilingual response generation.

**Claim 16 — Voice-Enabled Multilingual Legal Case Filing System**
A legal case filing system with voice input support comprising:
- a language selection interface presenting all 22 constitutionally scheduled languages of India, each identified by name in the native script, a standardized language code, and a regional flag indicator;
- a voice transcription module utilizing a browser-native speech recognition interface configured with the selected language code to capture spoken incident descriptions;
- an automatic transcription insertion mechanism that populates a case description field with the transcribed speech without requiring manual text entry;
- wherein the transcribed description is subsequently processed by an AI analysis module to generate a formal legal case title, category classification, and legal domain classification in the same session.

---

### B.2 Independent Method Claims (New)

**Claim 17 — Method for Auditable Legal Engagement Timeline**
A computer-implemented method for maintaining an auditable timeline of legal case engagements comprising:
- creating a case record in a database upon citizen submission, the record including a creation timestamp and an initially empty sequential event history array;
- appending a first event entry to the event history array upon citizen request for legal representation, the entry comprising a "Connection Requested" status label and the timestamp of the request;
- appending a second event entry upon advocate formal acceptance of the case, the entry comprising a "Lawyer Accepted" status label and the timestamp of acceptance;
- appending additional timestamped event entries for each subsequent status change, update note, or case management action performed by the assigned advocate;
- generating a display of all events by: prepending a synthetic initial entry using the case creation timestamp, merging with all array entries, sorting the merged set in ascending chronological order, and visually distinguishing the most recently added entry with an animated indicator element.

**Claim 18 — Method for Real-Time Multi-Channel Legal Event Notification**
A method for delivering legal case event notifications across multiple communication channels simultaneously comprising:
- detecting a legal case status change event triggered by a legal advocate action;
- creating a persistent notification record in a database associated with the affected citizen user, the record comprising a title, message text, icon identifier, and an unread status flag;
- transmitting a real-time push event via a WebSocket connection to a room identified by the citizen user's unique identifier, the event comprising notification text and a type classifier;
- generating a personalized notification message using a large language model, wherein the prompt to the language model includes the citizen's name, case title, and event context;
- transmitting the generated message to the citizen's registered mobile phone number via a mobile messaging API.

**Claim 19 — Method for Background Non-Blocking Document Ingestion**
A method for ingesting legal reference documents into an AI knowledge base without blocking the user interface comprising:
- receiving an uploaded legal document file via an HTTP multipart request;
- sanitizing the filename by replacing whitespace characters with underscore characters and removing non-alphanumeric characters except period and hyphen;
- storing the sanitized file in a designated directory accessible to an AI processing service;
- transmitting an immediate success response to the requesting client before document processing begins;
- spawning a separate operating system process executing a document ingestion script in the background, wherein the spawning operation is non-blocking to the HTTP response thread;
- capturing standard output and error streams from the spawned process for diagnostic logging without affecting the user experience.

---

### B.3 Dependent Claims (Extended Set)

**Claim 20** (depends on Claim 14): The system of Claim 14, wherein the authentication token is a cryptographically signed JSON Web Token embedding the user identifier and role, with an expiry of 86,400 seconds for citizen users and 604,800 seconds for legal advocate users, and wherein the token is accepted via two distinct HTTP header formats: an Authorization header with Bearer scheme and an x-auth-token header, to support multiple client implementation patterns.

**Claim 21** (depends on Claim 14): The system of Claim 14, further comprising a static bypass token configured to grant administrative access without database lookup, wherein said bypass token is validated before cryptographic token verification, enabling emergency administrative access when the primary authentication infrastructure is unavailable.

**Claim 22** (depends on Claim 15): The system of Claim 15, wherein the AI inference engine implements a priority cascade: a first cloud-hosted large language model operating at a temperature setting of 0.2 and a maximum output of 1,500 tokens; a second locally-hosted language model accessed via a local API endpoint, activated only when an environment configuration variable is set to a predetermined value; and a deterministic heuristic fallback that extracts the first seven words of the input text, appended with an ellipsis character, when both AI engines are unavailable.

**Claim 23** (depends on Claim 16): The system of Claim 16, further comprising a visual recording indicator that activates on the microphone input button during active voice capture, and wherein the speech recognition session is configured with a continuous listening mode set to false and interim result reporting set to false, such that the transcription fires once upon detection of a speech pause.

**Claim 24** (depends on Claim 17): The method of Claim 17, wherein the sorting algorithm applies a rounding function when converting the millisecond difference between the current device time and a stored hearing date — both normalized to midnight of their respective calendar days — to prevent off-by-one errors at day boundaries caused by sub-second timestamp precision differences.

**Claim 25** (depends on Claim 18): The method of Claim 18, wherein the mobile messaging API delivery includes automatic phone number normalization: if the stored phone number consists of exactly ten digits without a country prefix, the country code for India (+91) is prepended before transmission; if the number already begins with a plus sign, the number is transmitted as-is.

**Claim 26** (depends on Claim 1 from Part 2): The system of Claim 1, wherein the legal taxonomy comprises at least 19 categories in the civil domain, at least 19 categories in the criminal domain, at least 9 categories in the corporate domain, and additional categories in the family, labor, taxation, and cyber law domains, each category comprising a plain-language input keyword mapped to a formal court-recognized case title phrase.

**Claim 27** (depends on Claim 4 from Part 2): The method of Claim 4, wherein subscription plan tiers are defined as: a trial tier with a case limit of two; a starter tier with a case limit of five; and a professional tier with a case limit of nine thousand nine hundred ninety-nine, wherein the professional tier limit is specifically chosen to be numerically impractical to reach in normal usage, thereby functioning as an unlimited tier without requiring special-case handling in the enforcement logic.

**Claim 28** (depends on Claim 17): The method of Claim 17, wherein each status change triggers a parallel WhatsApp notification to the citizen whose case is updated, and wherein the notification message text is generated dynamically by an AI language model using a context-specific prompt template that includes the citizen's registered name, the case title, and the type of update, ensuring that no two notifications for different events are identical.

**Claim 29** (depends on Claim 19): The method of Claim 19, wherein the spawned document ingestion process is created using an operating system-appropriate Python interpreter command, determined at runtime by checking the platform identifier, using "python" on Windows systems and "python3" on POSIX-compliant systems, ensuring cross-platform compatibility of the background ingestion pipeline.

**Claim 30** (depends on Claim 2 from Part 2): The method of Claim 2, wherein the real-time WebSocket event upon lawyer acceptance is delivered to a private room identified by the citizen user's database identifier, said room having been joined by the citizen's browser upon application initialization, such that notification delivery is targeted exclusively to the affected citizen without broadcasting to other connected users.

---

## C. NOVELTY AND NON-OBVIOUSNESS ANALYSIS

### C.1 Technical Problem Solved

**Problem 1:** Legal case filing platforms require legally precise case titles, but most citizens cannot formulate them. Prior solutions either use rigid dropdown menus (limiting expressiveness) or accept free-text titles (producing legally imprecise records).

**Inventive solution:** A debounce-triggered AI pipeline with a domain-specific legal taxonomy converts plain-language incident descriptions into formally worded case titles indistinguishable from those drafted by legal professionals, without requiring the citizen to understand legal terminology.

**Non-obviousness:** The specific combination of (a) debounce timing calibrated to natural pause duration, (b) a curated taxonomy of 60+ case types serving as few-shot examples, (c) automatic form field population with visual AI-attribution badge, and (d) graceful degradation through three fallback levels is not taught or suggested by any known prior art in legal technology.

---

**Problem 2:** Lawyer-citizen matching on legal platforms is typically manual (citizen posts a case, any lawyer responds) or fully automated (random assignment). Neither approach creates an auditable pre-engagement record.

**Inventive solution:** A two-phase protocol with an intermediate "Pending Expert Acceptance" state creates a legally meaningful moment between request and commitment, recorded immutably in the case timeline.

**Non-obviousness:** While two-phase protocols exist in commerce (e.g., purchase authorization and capture), their application to legal engagement with (a) real-time socket notification to the advocate, (b) timeline entry at each phase transition, and (c) citizen-initiated advocate selection from an AI-matched shortlist is not present in known legal SaaS prior art.

---

**Problem 3:** Court hearing reminders in existing systems use static SMS templates sent by administrators. These messages are generic, do not mention case-specific details naturally, and go to only one party.

**Inventive solution:** A scheduled process generates AI-written, case-aware messages for each case individually and delivers them to both the citizen and the advocate.

**Non-obviousness:** Existing legal notification systems (court management software, SMS services) do not: (a) use LLM inference for per-case message generation, (b) deliver simultaneously to two parties, (c) adapt tone based on temporal proximity (same-day vs. 48-hour variants), or (d) fall back to hardcoded templates on AI failure — all of which combine to form a novel notification architecture.

---

**Problem 4:** Subscription quota systems in SaaS platforms commonly use cached counters that can be exploited by concurrent requests. Legal platforms in particular require precise quota enforcement because over-claiming creates legal liability.

**Inventive solution:** The quota is recomputed from the authoritative database on every case-accept request, synchronized to the advocate's profile, and the middleware blocks the request before any state change occurs.

**Non-obviousness:** While database-level counting for quota enforcement is known, its specific application in a legal marketplace context — where the billing cycle start is the subscriptionStartedAt timestamp (not a calendar month), the count is filtered by that exact date, and the result is atomically written back to the advocate profile in the same middleware chain — constitutes a novel implementation.

---

**Problem 5:** Calendar-day hearing countdowns in legal applications often produce incorrect results because they compare raw Unix timestamps, causing off-by-one errors near midnight.

**Inventive solution:** Both the current time and the hearing date are independently normalized to midnight (00:00:00.000) before subtraction, and a rounding function is applied to the day computation to handle sub-millisecond precision edge cases.

**Non-obviousness:** While midnight normalization is a known technique in calendar arithmetic, its specific necessity in the context of legal hearing countdowns — where a false "TODAY" notification could cause a lawyer or citizen to appear in court on the wrong day — and its combination with Math.round() (rather than Math.floor or Math.ceil) to handle edge cases at the midnight boundary represents a non-obvious engineering choice with real-world legal consequences.

---

**Problem 6:** Legal marketplace filtering by lawyer specialization using naive full-text search produces false positives when legal terminology in case descriptions accidentally matches specialization keywords.

**Inventive solution:** The regex match is restricted to the `type` and `title` fields of the case document, explicitly excluding the `description` field, preventing "keyword bleed" from descriptive text.

**Non-obviousness:** The insight that case descriptions will contain legal terminology that does not indicate the legal domain of the case (e.g., the word "cheating" in a property dispute description should not route the case to criminal law specialists) requires domain-specific legal knowledge combined with database query engineering. This combination is not present in known marketplace filtering prior art.

---

*End of Patent Technical Disclosure — Part 3*
*This document is additive to Parts 1 and 2. Together, all three parts constitute the complete patent technical disclosure for the JurisBot AI Legal Intelligence Platform.*
