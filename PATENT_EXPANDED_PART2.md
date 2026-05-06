# JURISBOT AI — EXPANDED PATENT TECHNICAL DISCLOSURE
## Part 2: State Machines, Data Flows, Network Interactions, Patent Claims & Novelty

---

## 3. COMPLETE REQUEST-RESPONSE LIFECYCLES

### 3.1 Lawyer Registration with File Upload

```
Client → multipart/form-data POST /api/auth/register-lawyer
Fields: name, email, password, phone, barId, experience, specialization
Files:  certificate (PDF/image), avatar (image)

Server:
1. multer processes two fieldnames: "certificate" → /uploads/certificates/, "avatar" → /uploads/avatars/
2. Filename format: BAR_{timestamp}_{originalname} (certificate), PROF_{timestamp}_{originalname} (avatar)
3. Validate: name, email, password, phone, barId required
4. Normalize email: .toLowerCase().trim()
5. Parallel existence check: User.findOne(email) + Lawyer.findOne(email)
6. bcrypt.genSalt(10) → bcrypt.hash(password, salt)
7. Lawyer.create({ ...fields, verificationStatus: "pending", subscriptionTier: "trial",
   subscriptionExpiresAt: Date.now() + 30*24*60*60*1000 })
8. verifyLawyerCredentials(lawyer._id, certificateUrl) ← NON-BLOCKING async
9. jwt.sign({ id, role: "lawyer" }, JWT_SECRET, { expiresIn: "7d" })
10. delete userResponse.password
11. Return { token, user, message: "Registration successful! Verification is in progress." }
```

### 3.2 Real-Time Chat Message Lifecycle

```
Sender (Client A):
1. socket.emit("send-message", { to: recipientId, message: { from, text, timestamp } })

Server (socket handler):
2. Message.create({ from: message.from, to: to, text: message.text })
3. io.to(to).emit("receive-message", message)

Recipient (Client B — if online):
4. socket.on("receive-message", (msg) => { append to messages array; scroll to bottom })

Recipient (Client B — if offline):
4b. Message persisted in DB; retrieved on next login via GET /api/chat/:userId
```

### 3.3 Video Call Signaling Lifecycle

```
Caller:
1. socket.emit("video-call-request", { to: recipientId, from: myId, fromName, roomId })

Server:
2. io.to(to).emit("incoming-video-call", { from, fromName, roomId })

Recipient:
3. GlobalCallNotification overlay renders with Accept/Reject buttons
4a. Accept → socket.emit("join-room", roomId)
   → navigate to /video-call?room={roomId}
4b. Reject → overlay dismissed

Both parties in VideoCall page:
5. socket.emit("join-room", roomId)
6. Server: socket.join(room); socket.to(room).emit("user-joined")
7. Peer A receives "user-joined" → creates RTCPeerConnection
8. Peer A: createOffer() → setLocalDescription(offer)
9. Peer A: socket.emit("offer", { room, sdp: offer })
10. Server: socket.to(room).emit("offer", data)
11. Peer B: setRemoteDescription(offer) → createAnswer() → setLocalDescription(answer)
12. Peer B: socket.emit("answer", { room, sdp: answer })
13. ICE candidates exchanged: socket.emit("ice-candidate", { room, candidate })
14. Server relays to room peers
15. Video streams connected via RTCPeerConnection.addTrack()

Call termination:
16. socket.emit("end-call", roomId)
17. Server: socket.to(room).emit("end-call")
18. Both: stop all MediaStreamTrack instances, close RTCPeerConnection
```

### 3.4 Admin Broadcast Lifecycle

```
Admin:
1. POST /api/admin/broadcast { target: "all"/"lawyers"/"citizens", title, message, priority }

Server:
2. io = req.app.get("io")
3. if target === "all": io.emit("institutional-broadcast", { title, message, priority })
4. else: io.emit(`institutional-broadcast-${target}`, { title, message, priority })
5. console.log broadcast record
6. Return { message: "Signal transmitted successfully" }

Lawyer Dashboard (listener):
7. socket.on("institutional-broadcast", (data) => { setBroadcast(data); show banner })
```

---

## 4. STATE MACHINES

### 4.1 Case Lifecycle State Machine

```
[OPEN]
  ↓ Citizen clicks "Connect" to specific lawyer
[PENDING EXPERT ACCEPTANCE]
  ↓ Lawyer clicks "Accept" on dashboard
[IN PROGRESS]
  ↓ Lawyer sets hearing date + court location
[HEARING SCHEDULED]
  ↓ Lawyer records post-hearing update
[VERDICT PENDING]
  ↓ Lawyer enters verdict field
[CLOSED]

Alternative paths:
[OPEN] → Lawyer claims from marketplace (PATCH /cases/:id/accept) → [IN PROGRESS]
[PENDING EXPERT ACCEPTANCE] → Lawyer ignores → remains [PENDING EXPERT ACCEPTANCE]
[ANY STATUS] → Admin can manually update via /admin/all-cases view
```

### 4.2 Lawyer Subscription Lifecycle

```
[TRIAL] (2 cases/month, 30 days from registration)
  ↓ casesClaimedCount >= 2 OR subscriptionExpiresAt < now
[EXPIRED] (blocked from claiming new cases)
  ↓ PATCH /lawyers/upgrade { planType: "Starter" }
[STARTER] (5 cases/month, +30 days from upgrade)
  ↓ PATCH /lawyers/upgrade { planType: "Pro" }
[PRO] (unlimited cases, caseLimit = 9999)
  ↓ subscriptionExpiresAt < now
[EXPIRED]

Renewal: If subscription still active → newExpiry = currentExpiry + 30 days
New: If subscription expired → newExpiry = now + 30 days
On upgrade: casesClaimedCount reset to 0; subscriptionStartedAt = now
```

### 4.3 Lawyer Verification State Machine

```
[UNVERIFIED] (default on registration, isVerified: false)
  ↓ Background AI verification runs (aiVerifier.js)
[PENDING] (verificationStatus: "pending")
  ↓ Admin reviews certificate + credentials
  ↓ Admin clicks "Approve"
[VERIFIED] (isVerified: true, verificationStatus: "verified")
  → Lawyer appears in citizen marketplace

  OR Admin clicks "Reject"
[REJECTED] (isVerified: false, verificationStatus: "rejected")
  → Lawyer blocked from marketplace
  → Lawyer can re-register with corrected documents

[VERIFIED] → Admin sets isBlocked: true → [BLOCKED]
[BLOCKED] → Admin sets isBlocked: false → [VERIFIED]
```

### 4.4 Notification State Machine

```
[CREATED] (isRead: false) → stored in DB + socket emitted
  ↓ User opens Notifications page
[READ] (isRead: true)
  → Read state persisted; notification remains in list
  → Audio chime plays on socket receipt (unread only)
```

### 4.5 Appointment State Machine

```
[PENDING] → Citizen books, awaits lawyer response
  ↓ Lawyer PATCH /appointments/:id/status { status: "Accepted" }
[ACCEPTED] → Citizen notified via socket + WhatsApp
  → Appointment linked to active case on dashboard

  OR Lawyer sets status: "Rejected"
[REJECTED] → Citizen notified; case remains Open
```

---

## 5. DATA FLOW PIPELINES

### 5.1 Case Filing Complete Data Flow

```
[User Device]
  Input: description text typed in textarea
  Event: onChange → React state update
  Timer: 2500ms debounce starts
  HTTP: POST /api/cases/analyze-story { description }

[Node.js Backend]
  Validate length
  Build Groq prompt with taxonomy
  HTTP: POST Groq API https://api.groq.com/openai/v1/chat/completions
  
[Groq Cloud (llama-3.3-70b)]
  Process: NLP analysis against legal taxonomy
  Output: JSON { title, category, legalType }

[Node.js Backend]
  Parse JSON response
  Return to client

[User Device]
  Form fields auto-populated: title, category, legalType
  UI: "SMART GEN" badge appears
  User reviews + clicks submit

[Node.js Backend]
  Case.create() → MongoDB
  Lawyer.find({ specialization regex }) → top 3 matches
  io.emit("marketplace-needs-refresh") → all lawyer clients
  
[MongoDB]
  Case document stored with ObjectId, user ref, null assignedLawyer, timestamps

[User Device]
  Success modal: matched lawyers list
  User clicks Connect

[Node.js Backend]
  Case.findByIdAndUpdate: assignedLawyer, status, trackingHistory
  Notification.create() for lawyer
  io.to(lawyerId).emit("notification")
  
[Lawyer Device]
  Socket event received → audio chime plays → dashboard refreshes
```

### 5.2 AI Chat Data Flow

```
[User Device — jurisbot-ui or React app]
  Input: legal question text
  HTTP: POST http://127.0.0.1:8088/chat { message, lang, userName }

[Python Flask AI Service]
  1. Check: is_notification (substring match)
  2. Check: greeting (exact match)
  3. Check: rejected_categories (any() match)
  4. Build system_instruction f-string with {lang}
  5. HTTP: POST https://api.groq.com/openai/v1/chat/completions
     headers: { Authorization: Bearer GROQ_API_KEY }
     body: { model: "llama-3.3-70b-versatile",
             messages: [system, user],
             temperature: 0.2,
             max_tokens: 1500 }

[Groq Cloud]
  Inference: ~1-3 seconds
  Response: { choices: [{ message: { content: "..." } }] }

[Python Flask]
  Extract: data["choices"][0]["message"]["content"]
  Return: { answer: "..." }

[User Device]
  Render markdown: **bold**, - bullets, ### headings
  Display in chat bubble with timestamp
```

---

## 6. NETWORK + DEVICE INTERACTION

### 6.1 WebSocket Lifecycle

```
Connection establishment:
1. Frontend imports socket singleton (created at module load)
2. io(BACKEND_URL) → HTTP upgrade to WebSocket (101 Switching Protocols)
3. Server: "Workspace Link Established: {socket.id}"

Room joining sequence (citizen):
4. Component mounts → socket.emit("join", userId)
5. Server: socket.join(userId) → private room for targeted delivery

Room joining sequence (video call):
6. socket.emit("join-room", roomId) → shared room
7. Server: socket.to(room).emit("user-joined") → triggers WebRTC handshake

Disconnection:
8. Browser tab closed OR network lost → socket.on("disconnect")
9. Server: "User disconnected from workspace: {socket.id}"
10. Socket.IO auto-reconnects on network recovery (client-side)
```

### 6.2 Media Device Handling (VideoCall.jsx)

```
Pre-call:
1. navigator.mediaDevices.getUserMedia({ video: true, audio: true })
2. localStream assigned to <video> element (muted=true for self-view)
3. localStream.getTracks() added to RTCPeerConnection via addTrack()

Call active:
4. Remote stream received via RTCPeerConnection "track" event
5. remoteStream assigned to second <video> element

Call termination (any party):
6. socket.on("end-call") OR user clicks "End Call"
7. localStream.getTracks().forEach(track => track.stop())  ← releases camera/mic
8. RTCPeerConnection.close()
9. Navigate back to dashboard
```

### 6.3 Agora Token Generation

```
Client: GET /generate-token?channel_name={room}&uid={userId}

Python Flask:
1. Validate channel_name present
2. role = 1 (Publisher)
3. expire = int(time.time()) + 3600
4. RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERT, channel_name, uid, role, expire)
5. Return { token, channel, uid }

Client:
6. Join Agora channel using token (hybrid WebRTC via Agora SDK)
```

### 6.4 Flutter Mobile App

```
- capacitor.config.json present → Capacitor bridge configured
- App ID: "io.ionic.starter" (placeholder, configurable)
- Flutter app (flutter_app/lib/video_call_screen.dart) handles:
  - WebRTC video call screen
  - Camera/mic permissions via Flutter plugins
  - Socket.IO connection via dart socket_io_client package
- Backend URL: same Node.js server (port 5000)
- Auth: same JWT token mechanism
```

---

## 7. EDGE CONDITION EXPANSION

### 7.1 AI Service Failure Chain

```
Detection: Groq API returns non-200 OR "choices" not in response OR timeout > 10s
Response:
  groq_err = str(exception)
  Attempt Ollama if USE_OLLAMA == "true":
    POST http://127.0.0.1:11434/api/generate { model: "mistral", prompt, stream: false }
    Timeout: 15s
    On success → return response.json()["response"]
  Else:
    Return "JurisBot is having trouble... (Debug: {groq_err})"
```

### 7.2 Duplicate Email on Registration

```
Detection: User.findOne(normalizedEmail) OR Lawyer.findOne(normalizedEmail) returns non-null
Response: 400 { message: "An account already exists with this email address." }
Recovery: User must use different email or login with existing account
Note: Both collections checked regardless of role parameter — prevents cross-role email collision
```

### 7.3 Case Access Unauthorized

```
Detection: 
  isOwner = (case.user._id.toString() === req.user.id) → false
  isAssigned = (case.assignedLawyer._id.toString() === req.user.id) → false
  isAdmin = (req.user.role === "admin") → false
  isOpenMarketplaceCase = (!assignedLawyer && role === "lawyer") → false
Response: 403 { message: "Access denied: You are not authorized to view this legal file." }
Recovery: No retry; user must have legitimate relationship to case
```

### 7.4 Subscription Limit Hit

```
Detection: casesClaimedCount >= caseLimit AND caseLimit !== 9999
Response: 403 { message: "Subscription limit reached. Please upgrade." }
UI: Lawyer sees "Upgrade Required" modal; redirected to /subscription
Recovery: PATCH /lawyers/upgrade → caseLimit updated → quota check passes
```

### 7.5 Marketplace Empty After Filter

```
Detection: openCases.length < 5 AND query.$or exists
Response: Discard filtered results; re-query ALL unassigned cases (no filter)
Rationale: Ensures lawyer always sees work; prevents empty dashboard due to narrow specialization
```

### 7.6 OTP Cache Miss (Server Restart)

```
Detection: otpCache[phone] === undefined (in-memory cache lost on restart)
Response: 400 { message: "OTP expired or invalid" }
Recovery: User must request new OTP; MSG91 sends fresh code
```

---

## 8. ALTERNATIVE IMPLEMENTATIONS (PATENT BOOST)

### 8.1 Real-Time Communication Alternatives
| Current | Alternative 1 | Alternative 2 |
|---------|---------------|---------------|
| Socket.IO | WebRTC Data Channels | Server-Sent Events (SSE) |
| MongoDB Message storage | Redis pub/sub + ephemeral | PostgreSQL with LISTEN/NOTIFY |

### 8.2 AI Engine Alternatives
| Current | Alternative 1 | Alternative 2 |
|---------|---------------|---------------|
| Groq llama-3.3-70b | OpenAI GPT-4o | Anthropic Claude 3.5 |
| Ollama local fallback | LM Studio API | llama.cpp server |
| In-memory OTP cache | Redis TTL keys | Database with expiry index |

### 8.3 Subscription Enforcement Alternatives
| Current | Alternative 1 | Alternative 2 |
|---------|---------------|---------------|
| Middleware DB query | JWT claim with embedded quota | Redis counter with expiry |
| casesClaimedCount field | Stripe metered billing | Event sourcing count |

### 8.4 File Storage Alternatives
| Current | Alternative 1 | Alternative 2 |
|---------|---------------|---------------|
| Local filesystem /uploads | AWS S3 + presigned URLs | Cloudinary |
| Multer diskStorage | Multer memoryStorage + S3 | MinIO (self-hosted S3) |

### 8.5 Hearing Notification Alternatives
| Current | Alternative 1 | Alternative 2 |
|---------|---------------|---------------|
| node-cron in-process | Bull queue + Redis | AWS EventBridge scheduled |
| Twilio WhatsApp | Firebase FCM push | Email via SendGrid |
| AI per-case message | Template with placeholders | LLM batch generation |

---

## 9. PATENT CLAIM EXPANSION

### Independent Claims

**Claim 1 — AI-Powered Legal Case Auto-Classification System**
A computer-implemented system for automatically classifying and formally titling legal cases, the system comprising:
- a client-side timer mechanism configured to detect cessation of user text input after a predetermined interval of 2,500 milliseconds;
- a natural language processing module operably connected to a large language model, wherein the module transmits user-provided incident descriptions to the language model with a domain-specific legal taxonomy comprising at least 60 pre-defined legal case categories;
- a form population mechanism configured to receive the formal legal title, category, and legal classification from the language model and automatically populate corresponding form fields without further user interaction;
- a visual indicator configured to distinguish AI-generated field values from user-entered values.

**Claim 2 — Two-Phase Lawyer-Citizen Engagement Protocol**
A method for managing legal consultation engagement in a digital platform, the method comprising:
- receiving a citizen's selection of a specific legal advocate from a filtered marketplace;
- transitioning a case record to an intermediate state of "Pending Expert Acceptance" and recording said transition with a timestamp in a persistent audit trail;
- transmitting a real-time notification to the selected advocate via WebSocket protocol;
- upon advocate confirmation, transitioning the case record to an "In Progress" state and appending a second timestamped entry to the audit trail;
- simultaneously delivering a notification to the citizen via WebSocket and an AI-generated message via a mobile messaging platform.

**Claim 3 — AI-Generated Contextual Hearing Reminders**
A system for automated delivery of hearing reminders comprising:
- a scheduled process executing at a predetermined daily time that queries a legal case database for cases with hearing dates matching the current date or within 48 hours;
- a natural language generation module that generates individualized reminder messages for each case using case-specific metadata including case title and party names;
- a delivery mechanism configured to transmit said individualized messages to both the citizen party and the legal advocate assigned to each case via a mobile messaging API;
- a fallback mechanism that substitutes pre-formatted template messages when the natural language generation module is unavailable.

**Claim 4 — Live Subscription Quota Enforcement**
A subscription management method for a legal services marketplace comprising:
- intercepting each request by a legal advocate to accept a new legal case via a middleware component;
- querying a case database to count cases assigned to the advocate since the start of the current subscription period;
- synchronizing the computed count to the advocate's profile record;
- comparing the computed count against a subscription tier-specific case limit;
- blocking the case acceptance and returning an authorization error when the count meets or exceeds the limit, except when the limit value equals a sentinel value representing unlimited access.

**Claim 5 — Calendar-Day Accurate Hearing Countdown**
A method for computing and displaying time remaining until a legal hearing comprising:
- normalizing both the current device timestamp and the stored hearing date to midnight of their respective calendar days by setting hours, minutes, seconds, and milliseconds to zero;
- computing the difference in milliseconds between the normalized hearing date and the normalized current date;
- converting the millisecond difference to a whole number of calendar days using a rounding function;
- rendering distinct visual indicators based on the computed day count, wherein: a negative count triggers a "passed" indicator, zero triggers an urgent same-day indicator, values of one through three trigger a near-term warning indicator, and values greater than three trigger a standard indicator.

---

### Dependent Claims

**Claim 6** (depends on Claim 1): The system of Claim 1, wherein the natural language processing module implements a priority cascade comprising a cloud-hosted language model as primary, a locally-hosted language model as secondary fallback, and a heuristic extraction of the first seven words of the description as tertiary fallback.

**Claim 7** (depends on Claim 1): The system of Claim 1, wherein the cessation detection mechanism is additionally triggered by a user focus-departure event from the text input element, independently of the timer mechanism.

**Claim 8** (depends on Claim 2): The method of Claim 2, wherein the audit trail is implemented as an embedded sub-document array within the case record, each entry comprising a status string and a timestamp, and wherein the array is sorted chronologically for display, with the most recent entry visually distinguished by an animated indicator.

**Claim 9** (depends on Claim 3): The system of Claim 3, wherein the AI-generated reminder message content varies based on temporal proximity, using a first prompt template for same-day hearings emphasizing urgency and encouragement, and a second prompt template for 48-hour hearings emphasizing preparation requirements.

**Claim 10** (depends on Claim 4): The method of Claim 4, wherein upgrading a subscription tier resets the counted case usage to zero and sets a new subscription period start timestamp, such that the quota computation window begins fresh from the upgrade date.

---

### Narrow Technical Claims

**Claim 11 — Dual-Collection User Architecture**
A legal platform authentication system comprising separate database collections for citizen users and legal advocates, wherein: a login endpoint dynamically selects the appropriate collection based on a role parameter in the request; email uniqueness is enforced across both collections at the application layer; and a hybrid user resolution endpoint queries both collections in sequence to resolve user identity by identifier.

**Claim 12 — Specialization-Filtered Marketplace with Adaptive Fallback**
A case marketplace filtering method comprising: parsing a legal advocate's specialization string by delimiter characters to extract individual specialization keywords; querying unassigned cases where the case type or case title matches any keyword using case-insensitive pattern matching, while explicitly excluding case description fields from the pattern match; and expanding the result set to all unassigned cases when the filtered result count falls below a minimum threshold of five records.

**Claim 13 — Sidebar State Persistence with Pre-Paint Restoration**
A web application sidebar comprising: a state storage mechanism using browser local storage to persist an open or closed state across page sessions; a state restoration mechanism that sets CSS transition duration to zero before restoring the saved state and then reinstates the transition duration after two animation frames, preventing visible state change on page load; and a synchronization mechanism that simultaneously applies a translation transform to the sidebar element and a corresponding margin adjustment to the main content element, ensuring smooth simultaneous animation without layout reflow.

---

## 10. NOVELTY JUSTIFICATION

### 10.1 AI Legal Auto-Fill
**Non-obvious because:** Prior art legal platforms require users to manually select case categories from menus. The combination of (a) debounce-triggered analysis, (b) domain-specific legal taxonomy with 60+ formal court case titles, and (c) automatic form population using LLM inference has no documented prior implementation in legal SaaS.

**Technical advantage:** Reduces case filing errors; generates legally precise titles that courts recognize; accessible to users unfamiliar with legal terminology.

### 10.2 Two-Phase Acceptance with Auditable Trail
**Non-obvious because:** Standard legal platforms either auto-assign lawyers or use a simple accept/reject button with no intermediate state. The "Pending Expert Acceptance" intermediate state creates a legally significant moment in the engagement record — neither party is committed, yet the request is documented with timestamps.

**Technical advantage:** Creates irrefutable evidence of when engagement was requested and when it was accepted; protects both parties; enables platform to monitor response time SLAs.

### 10.3 AI-Generated WhatsApp Hearing Reminders
**Non-obvious because:** Existing court reminder systems send generic SMS templates. Generating individualized, case-aware messages via LLM for each case-party pair, then delivering via WhatsApp (higher open rate than SMS), is a novel combination.

**Technical advantage:** Higher engagement due to personalization; WhatsApp delivery reaches users who ignore SMS; AI-generated text maintains professional legal tone without manual effort.

### 10.4 Live Quota Sync on Every Accept
**Non-obvious because:** Standard SaaS quota systems use cached counts or periodic sync jobs. Recomputing from the database on every case-accept request, then updating the stored count atomically, prevents race conditions where two simultaneous accept requests could both pass a stale quota check.

**Technical advantage:** Zero over-claiming; eliminates need for distributed locks or Redis counters; self-healing — quota automatically corrects if database is modified externally.

### 10.5 Calendar-Day Normalization for Countdown
**Non-obvious because:** Naive timestamp subtraction produces incorrect results near midnight boundaries (a hearing at 9 AM on the next calendar day might show as "0 days away" if checked at 11 PM the previous night). Midnight normalization of both dates before subtraction is the correct engineering solution that is frequently absent in production systems.

**Technical advantage:** Eliminates false "TODAY" notifications; consistent behavior regardless of server timezone vs. client timezone; prevents user confusion from inaccurate countdown.

### 10.6 Description-Excluded Marketplace Regex
**Non-obvious because:** Naive keyword search against all case fields causes "keyword bleed" — a cheating lawyer sees property cases because the word "cheating" appears in the description. Deliberately restricting regex to type and title fields requires domain knowledge of the problem.

**Technical advantage:** Lawyers see only relevant cases; reduces cognitive load; prevents irrelevant case spam on specialist dashboards.

---

*End of Expanded Patent Technical Disclosure — Part 2*
*Combined with Part 1, this document covers all 11 required patent disclosure sections at implementation-level depth.*
