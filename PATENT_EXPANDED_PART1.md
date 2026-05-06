# JURISBOT AI — EXPANDED PATENT TECHNICAL DISCLOSURE
## Part 1: System Decomposition + Low-Level Feature Execution

---

## 1. SYSTEM DECOMPOSITION (ULTRA-DETAILED)

### 1.1 Frontend Layer — Three Isolated React Applications

**1.1.1 Citizen Portal (frontend/)**
- Entry: `main.jsx` → `App.jsx` → React Router DOM v6
- Route guards: reads `localStorage.getItem("token")` + `localStorage.getItem("user")`; parses role field; redirects unauthenticated users to `/login`
- Axios instance (`src/api/axios.js`): base URL from `VITE_API_URL` env; request interceptor injects `Authorization: Bearer <token>` header on every outbound call
- Socket instance (`src/api/socket.js`): singleton `io(BACKEND_URL)` created once at module load; reused across all components
- Pages: FilingConsole, RecentCases, CaseDetails, ConsultLawyer, RealTimeChat, VideoCall, Documents, Notifications, Profile, Settings, DashboardHome, MessagesList, Alerts, Terms
- CSS: per-page CSS files (no global framework); custom properties for theming

**1.1.2 Lawyer Portal (lawyer-frontend/)**
- Separate Vite app; independent `node_modules`
- Pages: LawyerDashboard, CaseDetails, AssignedCases, Subscription, VideoCall, Notifications, MessagesList
- Subscription state fetched from `/analytics/lawyer` on every dashboard mount
- `socket.js`: same singleton pattern; joins lawyer's own userId room on mount via `socket.emit("join", lawyerId)`

**1.1.3 Admin Portal (admin-frontend/)**
- Vite app; minimal pages: Dashboard, VerificationQueue, LawsManager, BroadcastConsole
- Auth: uses `admin_master_token` or admin JWT stored in localStorage
- No socket dependency; purely REST-based

**1.1.4 Standalone JurisBot UI (jurisbot-ui/)**
- Vanilla HTML/CSS/JS; no build step
- `script.js` wrapped in IIFE to prevent global scope pollution
- Connects to `http://127.0.0.1:8088/chat` directly (bypasses Node.js backend)

---

### 1.2 Backend Layer — Node.js Monolith

**1.2.1 Express Application (server.js)**
- HTTP server created via `http.createServer(app)` — required for Socket.IO attachment
- Middleware stack (in order):
  1. `cors()` — dynamic origin allow-all
  2. `express.json()` — body parsing
  3. `express.static("/uploads")` — file serving
- Route mounting: 9 route modules at `/api/*`
- `app.set("io", io)` — exposes Socket.IO instance to all route handlers via `req.app.get("io")`
- Auto-creates `/uploads/documents` on startup if missing

**1.2.2 Socket.IO Server**
- Attached to same HTTP server (shared port 5000)
- CORS: `origin: "*"`, methods: GET/POST/PATCH/PUT/DELETE
- Room architecture:
  - Private rooms: `socket.join(userId)` — per-user notification delivery
  - Shared rooms: `socket.join(roomId)` — video/chat consultations
- Message persistence: `send-message` handler calls `Message.create()` before broadcasting
- Marketplace broadcast: `update-marketplace` → `io.emit("marketplace-needs-refresh")` to ALL connected clients

**1.2.3 Route Modules**
- `auth.js`: registration, login, OTP, profile update; uses multer for file uploads
- `cases.js`: largest module (621 lines); handles full case lifecycle
- `lawyers.js`: marketplace listing, profile, subscription upgrade
- `appointments.js`: booking, status management
- `analytics.js`: stats aggregation for all three portals
- `admin.js`: verification queue, law upload, broadcast
- `notifications.js`: CRUD for notification records
- `documents.js`: document upload/list
- `chat.js`: message history retrieval
- `branding.js`: serves branding assets

**1.2.4 Middleware**
- `auth.js` middleware: JWT verification; dual-header support (`x-auth-token` OR `Authorization: Bearer`); static bypass for `admin_master_token`; role array enforcement
- `checkSubscription.js`: case quota enforcement; queries DB live; syncs `casesClaimedCount`

**1.2.5 Background Workers**
- `scheduler.js`: `node-cron` job at `"0 8 * * *"` (8 AM daily); queries cases with hearingDate match; calls AI service; dispatches Twilio WhatsApp
- `aiVerifier.js`: called async on lawyer registration; non-blocking

---

### 1.3 AI Service Layer — Python Flask (port 8088)

- `app.py`: single-file Flask app with CORS enabled
- Two endpoints: `POST /chat`, `GET /generate-token`
- AI engine priority: Groq API (cloud) → Ollama (local, opt-in) → hardcoded fallback
- Subject filter: 19-keyword blocklist checked via `any(topic in user_input.lower()...)`
- Greeting detection: exact string match against 5 trigger phrases
- Notification mode: substring detection for "reminder", "alert", "whatsapp", "1-sentence"
- System prompt: f-string with `{lang}` variable injection for multilingual support
- Agora token: `RtcTokenBuilder.buildTokenWithUid()` with 3600s expiry

---

### 1.4 Database Layer — MongoDB via Mongoose

- 7 collections: users, lawyers, cases, appointments, messages, notifications, documents
- Dual-collection user architecture: citizens in `users`, advocates in `lawyers` — entirely separate Mongoose models
- `lawyers` collection explicitly named via `{ collection: 'lawyers' }` option
- Cross-collection email uniqueness enforced at application layer (not DB index across collections)
- Referential integrity: ObjectId refs with `.populate()` for joins
- `trackingHistory`: sub-document array (embedded, not referenced) for atomic case timeline updates

---

### 1.5 External Service Integrations

| Service | Purpose | Trigger | Fallback |
|---------|---------|---------|---------|
| Groq API | LLM inference | Every `/chat` request | Ollama → hardcoded |
| Twilio | WhatsApp delivery | Case events + cron | Console simulation |
| MSG91 | OTP SMS delivery | Phone verification | OTP still generated |
| Agora | Video call tokens | Pre-call setup | 500 error returned |
| Multer (local) | File storage | Registration + upload | Directory auto-created |

---

## 2. LOW-LEVEL FEATURE EXECUTION

### 2.1 AI Case Title Auto-Fill (FilingConsole.jsx)

**State variables involved:**
- `formData.description` (string)
- `isAnalyzing` (boolean)
- `aiMessage` (string)

**Execution sequence:**
```
1. User types in description textarea
2. onChange → setFormData({...formData, description: e.target.value})
3. useEffect dependency: [formData.description]
4. Guard: if description.length < 20 → return (no API call)
5. Set timer: setTimeout(handleAIAutoFill, 2500)
6. If user types again before 2500ms → clearTimeout(previous timer)
7. On blur: onBlur={handleAIAutoFill} fires immediately (no debounce)
8. handleAIAutoFill():
   a. Guard: if description.length < 20 → return
   b. setIsAnalyzing(true)
   c. setAiMessage("JurisBot AI is analyzing your story...")
   d. POST /cases/analyze-story { description }
   e. On success: setFormData({...prev, title: res.data.title, category: res.data.category, legalType: res.data.legalType})
   f. setAiMessage("✨ Magic! I've suggested a Title and Category...")
   g. On error: setAiMessage("I've captured your story. Please review...")
   h. finally: setIsAnalyzing(false)
```

**UI state transitions:**
- `isAnalyzing = false` → input shows placeholder "Formal title for legal filing"
- `isAnalyzing = true` → placeholder changes to "Processing narration...", container gets `.glow` CSS class
- `isAnalyzing = false AND formData.title non-empty` → "SMART GEN" badge renders

---

### 2.2 Backend: analyze-story Endpoint

**Request payload:** `{ description: string }` (min 10 chars enforced)

**Processing pipeline:**
```
1. Validate: description.length < 10 → 400
2. Load TAXONOMY_TITLES object (60+ entries across Civil/Criminal/Corporate/Family/Labor/Cyber/Taxation)
3. Build Groq prompt:
   - System: "You are a legal expert. Analyze description and return JSON: {title, category, legalType}"
   - Include full taxonomy as reference
   - User: description text
4. POST to Groq API (llama-3.3-70b-versatile, temp=0.2)
5. Parse response JSON
6. If Groq fails → try Gemini API (GEMINI_KEY from env)
7. If Gemini fails → heuristic: first 7 words of description + "..."
   category = "General Legal", legalType = "Civil"
8. Return { title, category, legalType }
```

**Taxonomy examples (Civil):**
- "property dispute" → "Suit for Declaration and Permanent Injunction in Property Dispute"
- "breach of contract" → "Suit for Damages for Breach of Contract"
- "money recovery" → "Suit for Recovery of Money"

**Taxonomy examples (Criminal):**
- "cheating" → "Complaint for Cheating and Dishonest Inducement"
- "domestic violence" → "Complaint for Domestic Violence under Criminal Law"
- "cybercrime" → "Complaint for Cybercrime under IT Act"

---

### 2.3 Case Filing Submission

**Trigger:** User clicks "FINALIZE & FILE CASE" on step 4

**Validation (client-side):**
```
if (!title.trim() || !description.trim() || !category || !incidentDate)
  → alert("Incomplete Details...") → return
```

**API call:** `POST /api/cases` with full formData

**Backend execution:**
```
1. Extract: title, description, type, urgency, category, legalType, incidentDate
2. Create Case document:
   - user = req.user.id (from JWT)
   - assignedLawyer = null
   - status = "Open" (default)
   - urgency = urgency || "Normal"
3. await newCase.save()
4. Expert matching:
   - Lawyer.find({ specialization: { $regex: legalType, $options: "i" } })
   - .limit(3).select("name specialization rating experience photo")
5. io.emit("marketplace-needs-refresh") → all lawyer dashboards refresh
6. Return { case: newCase, suggestedLawyers: matchedLawyers }
```

**Frontend post-submit:**
```
setCurrentCaseId(res.data.case._id)
setMatchedLawyers(res.data.suggestedLawyers || [])
setShowSuccessModal(true)
```

---

### 2.4 Connect to Lawyer Flow

**Trigger:** Citizen clicks "Connect" button on matched lawyer card

**State:** `isConnecting = true` → pulse loader shown

**API:** `POST /api/cases/connect/:caseId/:lawyerId`

**Backend execution:**
```
1. findByIdAndUpdate(caseId):
   - assignedLawyer = lawyerId
   - status = "Pending Expert Acceptance"
   - $push trackingHistory: { status: "Connection Requested", date: new Date() }
2. Notification.create({ user: lawyerId, title: "New Consultation Request", ... })
3. io.to(lawyerId).emit("notification", { text: "New Consultation Request!", type: "new_request" })
4. io.emit("marketplace-needs-refresh")
5. Return { message: "Request Sent to Expert", case: updatedCase }
```

**Frontend post-connect:**
```
setTimeout(() => navigate("/cases"), 2000)
```

---

### 2.5 Lawyer Dashboard Data Loading

**All 5 API calls fired in parallel via Promise.all:**
```javascript
Promise.all([
  axios.get("/analytics/lawyer"),     // stats + subscription
  axios.get("/appointments/received"), // all appointments
  axios.get("/cases/open"),           // marketplace cases
  axios.get("/cases/requested"),      // pending requests
  axios.get("/cases/my")              // active workspace cases
])
```

**Pending Queue merge logic:**
```
pendingAppointments = appointments.filter(a => a.status === "Pending")
  .map(a => ({...a, itemType: 'appointment'}))

requestedCases = requestedCasesRes.data.map(c => ({
  _id: c._id, userId: c.user, caseId: c,
  status: "Requested", itemType: 'case_request',
  date: new Date(c.createdAt).toLocaleDateString(),
  time: new Date(c.createdAt).toLocaleTimeString()
}))

merged = [...pendingAppointments, ...requestedCases]
```

**Active Workspace merge logic:**
```
activeStatuses = ["In Progress", "Hearing Scheduled", "Verdict Pending", "Accepted"]
activeCases = myCases.filter(c => activeStatuses.includes(c.status))

mergedActive = activeCases.map(c => {
  linkedAppt = acceptedAppts.find(a => a.caseId?._id === c._id)
  return { ...c, itemType: 'active_case',
    date: linkedAppt?.date || "Ongoing",
    time: linkedAppt?.time || "Consultation" }
})
+ acceptedAppts NOT linked to any active case
```

**Local stats computation (overrides server stats for accuracy):**
```
uniqueClients = new Set(mergedActive.map(a => a.userId?._id || a.userId))
setStats({ totalCases: activeCases.length, activeClients: uniqueClients.size, pendingApps: merged.length })
```

---

### 2.6 Case Accept Flow (Lawyer)

**Route:** `POST /api/cases/accept/:caseId`

**Execution:**
```
1. findByIdAndUpdate(caseId):
   - status = "In Progress"
   - $push trackingHistory: { status: "Lawyer Accepted", date: new Date() }
2. Notification.create({ user: acceptedCase.user._id, title: "Request Accepted", ... })
3. io.to(acceptedCase.user._id.toString()).emit("notification", { text: "...", type: "case_accepted" })
4. User.findById(acceptedCase.user._id) → get phone
5. sendAIWhatsApp(phone, name, caseTitle, "case_update")
6. Return { message: "Case Accepted Successfully", case: acceptedCase }
```

**sendAIWhatsApp execution:**
```
1. Build prompt based on context ("case_update")
2. POST http://127.0.0.1:8088/chat { message: prompt, userName }
3. Get AI-generated text from response.data.answer
4. twilio.messages.create({ from: "whatsapp:+14155238886", body: text, to: "whatsapp:+91XXXXXXXXXX" })
5. On Twilio error → console.error (no retry)
6. If Twilio creds missing → console.log simulation
```

---

### 2.7 Hearing Countdown Algorithm (CaseDetails.jsx)

**Input:** `case.hearingDate` (Date object from MongoDB), `new Date()` (device clock)

**Exact computation:**
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);  // midnight normalize

const hearing = new Date(case.hearingDate);
hearing.setHours(0, 0, 0, 0);  // midnight normalize

const diffMs = hearing - today;
const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

if (diffDays < 0)  → "Hearing date has passed" (grey)
if (diffDays === 0) → "Your hearing is TODAY" (red pulse)
if (diffDays <= 3)  → "Hearing in X days" (red urgent)
if (diffDays > 3)   → "Hearing in X days" (gold normal)
```

**Key design:** `Math.round()` used (not `Math.floor()`) to prevent off-by-one errors at midnight boundary.

---

### 2.8 Chronological Timeline Sorting (CaseDetails.jsx)

**Input sources:**
1. Static entry: `{ status: "Case Filed & Registered", date: case.createdAt }`
2. Dynamic entries: `case.trackingHistory[]` (each has `status` string + `date` Date)

**Merge + sort:**
```javascript
const allMilestones = [
  { status: "Case Filed & Registered", date: new Date(case.createdAt) },
  ...case.trackingHistory.map(h => ({ status: h.status, date: new Date(h.date) }))
].sort((a, b) => new Date(a.date) - new Date(b.date));
```

**Active dot logic:**
```javascript
allMilestones[allMilestones.length - 1] → gets className "active"
```
All others → non-active styling.

---

### 2.9 Subscription Enforcement (checkSubscription middleware)

**Execution on PATCH /cases/:id/accept:**
```
1. Extract lawyerId from req.user.id
2. Lawyer.findById(lawyerId) → get subscriptionTier, caseLimit, subscriptionStartedAt
3. Case.countDocuments({ assignedLawyer: lawyerId, createdAt: { $gte: subscriptionStartedAt } })
4. Lawyer.findByIdAndUpdate(lawyerId, { casesClaimedCount: count })
5. if (caseLimit !== 9999 && count >= caseLimit):
   → return 403 { message: "Subscription limit reached. Please upgrade." }
6. else → next()
```

**Plan limits:**
- Trial: caseLimit = 2
- Starter: caseLimit = 5
- Pro: caseLimit = 9999 (effectively unlimited, never triggers block)

---

### 2.10 Open Case Marketplace Filter (/cases/open)

```
1. Lawyer.findById(req.user.id) → get specialization string
2. Split by /[&,]/ → array of keywords (trimmed)
3. If keywords exist:
   matchCriteria = keywords.map(kw => ({
     $or: [
       { type: { $regex: kw, $options: "i" } },
       { title: { $regex: kw, $options: "i" } }
     ]
   }))
   query = { assignedLawyer: null, $or: matchCriteria }
4. Case.find(query).populate("user", "name").sort({ createdAt: -1 })
5. If results.length < 5 AND query.$or exists:
   → fallback: Case.find({ assignedLawyer: null }).populate(...).sort(...)
   → deduplication not needed (all open cases returned)
6. Return results
```

**Key design:** Description field intentionally excluded from regex match to prevent irrelevant keyword overlap ("cheating" in description ≠ cheating law specialization).

---

### 2.11 OTP Verification System

**Request OTP:**
```
1. Receive { phone }
2. Generate: Math.floor(100000 + Math.random() * 900000).toString()
3. Store: otpCache[phone] = { otp, expires: Date.now() + 300000 }
4. Normalize phone: strip non-digits; if 10 digits → prepend "91"
5. POST MSG91 API: https://control.msg91.com/api/v5/otp?mobile={phone}&authkey={key}&otp={otp}
6. On MSG91 error → log error but still return success (OTP usable for dev)
7. Return { message: "...", otp } (OTP exposed in response for dev/testing)
```

**Verify OTP:**
```
1. Receive { phone, otp }
2. cached = otpCache[phone]
3. if (!cached) → 400 "OTP expired or invalid"
4. if (cached.otp !== otp || Date.now() > cached.expires) → 400 "Incorrect or expired OTP"
5. delete otpCache[phone]
6. Return { verified: true }
```

---

### 2.12 Hybrid Login (auth.js /login)

```
1. Receive { email, password, role }
2. normalizedEmail = email.toLowerCase().trim()
3. Model = (role === "lawyer") ? Lawyer : User
4. user = await Model.findOne({ email: normalizedEmail })
5. if (!user) → 400 "Invalid credentials"
6. isMatch = await bcrypt.compare(password, user.password)
7. if (!isMatch) → 400 "Invalid credentials"
8. token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" })
9. userResponse = user.toObject(); delete userResponse.password
10. Return { token, user: userResponse }
```

**Security note:** Same error message for both "user not found" and "wrong password" — prevents user enumeration attacks.

---

### 2.13 Daily Hearing Notification Scheduler

**Cron expression:** `"0 8 * * *"` = every day at 08:00 server local time

**Execution:**
```
1. today = new Date(); after48h = new Date(); after48h.setDate(today.getDate() + 2)
2. todayStr = today.toISOString().split("T")[0]   // "YYYY-MM-DD"
3. after48hStr = after48h.toISOString().split("T")[0]
4. Case.find({ hearingDate: { $in: [todayStr, after48hStr] }, status: "In Progress" })
   .populate("user assignedLawyer")
5. For each case:
   a. isToday = (case.hearingDate === todayStr)
   b. generateAILegalAlert(caseData, isToday):
      - Build prompt (today vs 48h variant)
      - POST http://127.0.0.1:8088/chat { message: prompt, userName }
      - Return AI text OR hardcoded fallback on error
   c. if (assignedLawyer?.phone) → sendWhatsApp(lawyer.phone, aiText)
   d. if (user?.phone) → sendWhatsApp(user.phone, aiText)
```

**Phone normalization in sendWhatsApp:**
```
phone.startsWith("+") ? phone : "+91" + phone
```
