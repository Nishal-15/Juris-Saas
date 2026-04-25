const router = require("express").Router();
const Case = require("../models/Case");
const User = require("../models/User");
const Lawyer = require("../models/Lawyer"); // 👈 Added
const auth = require("../middleware/auth");
const checkSub = require("../middleware/checkSubscription");

/* Create Case */
router.post("/", auth(), async (req, res) => {
  try {
    const { title, description, type, urgency } = req.body;

    const newCase = new Case({
      title,
      description,
      type,
      urgency: urgency || "Normal",
      user: req.user.id,
      assignedLawyer: null
    });

    await newCase.save();

    // 🔬 BROADCAST: Marketplace Update for matching experts
    const io = req.app.get("io");
    if (io) io.emit("marketplace-needs-refresh");

    res.json(newCase);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* User Cases */
router.get("/", auth(), async (req, res) => {
  try {
    const cases = await Case.find({ user: req.user.id })
      .populate("assignedLawyer", "name");

    res.json(cases);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Admin: List ALL Cases */
router.get("/admin/all", auth(["admin"]), async (req, res) => {
  try {
    const cases = await Case.find()
      .populate("user", "name")
      .populate("assignedLawyer", "name")
      .sort({ createdAt: -1 });

    res.json(cases);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Lawyer Cases */
router.get("/lawyer", auth(["lawyer"]), async (req, res) => {
  try {
    const cases = await Case.find({ assignedLawyer: req.user.id })
      .populate("user", "name");

    res.json(cases);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Lawyer: List ALL OPEN (Unassigned) Cases (Expert-Specific Filter) */
router.get("/open", auth(["lawyer"]), async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.user.id);
    const keywords = lawyer?.specialization?.split(/[&,]/).map(k => k.trim()) || [];

    // 🔬 LASER-FOCUS: Only check 'Type' and 'Title' — avoid Description bleed
    const matchCriteria = keywords.map(kw => ({
      $or: [
        { type: { $regex: kw, $options: "i" } },
        { title: { $regex: kw, $options: "i" } }
      ]
    }));

    const query = { assignedLawyer: null };
    
    // If lawyer has specializations, filter by them. Otherwise, show all.
    if (keywords.length > 0 && keywords[0] !== "") {
       query.$or = matchCriteria;
    }

    const openCases = await Case.find(query)
      .populate("user", "name")
      .sort({ createdAt: -1 });

    // 🔬 FALLBACK: If expert filter returned nothing, show all open cases
    if (openCases.length === 0 && query.$or) {
       const fallbackCases = await Case.find({ assignedLawyer: null })
         .populate("user", "name")
         .sort({ createdAt: -1 });
       return res.json(fallbackCases);
    }

    res.json(openCases);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Lawyer: List assigned cases (ALIAS for dashboard) */
router.get("/my", auth(["lawyer"]), async (req, res) => {
  try {
    const cases = await Case.find({ assignedLawyer: req.user.id }).populate("user", "name");
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Lawyer: Accept/Claim a Case */
router.post("/:id/assign", auth(["lawyer"]), async (req, res) => {
  try {
    const targetCase = await Case.findById(req.params.id);
    if (!targetCase) return res.status(404).json({ message: "Case not found" });
    if (targetCase.assignedLawyer) return res.status(400).json({ message: "Already assigned." });

    targetCase.assignedLawyer = req.user.id;
    targetCase.status = "In Progress";
    await targetCase.save();

    // ✅ Update Lawyer Case Count Metrics
    await Lawyer.findByIdAndUpdate(req.user.id, { $inc: { casesClaimedCount: 1 } });

    // 🔬 BROADCAST: Case Claimed! Refresh other marketplaces
    const io = req.app.get("io");
    if (io) io.emit("marketplace-needs-refresh");

    res.json({ message: "Case assigned successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Lawyer: Accept/Claim a Case (Patch ALIAS) */
router.patch("/:id/accept", [auth(["lawyer"]), checkSub], async (req, res) => {
  try {
    const targetCase = await Case.findById(req.params.id);
    if (!targetCase) return res.status(404).json({ message: "Case not found" });
    if (targetCase.assignedLawyer) return res.status(400).json({ message: "Already assigned." });

    // ✅ Update Lawyer Case Count
    await Lawyer.findByIdAndUpdate(req.user.id, { $inc: { casesClaimedCount: 1 } });

    targetCase.assignedLawyer = req.user.id;
    targetCase.status = "In Progress";
    await targetCase.save();

    // 🔬 BROADCAST: Case Claimed! Refresh other marketplaces
    const io = req.app.get("io");
    if (io) io.emit("marketplace-needs-refresh");

    res.json({ message: "Case successfully assigned!", targetCase });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Lawyer: Update Case Management (Tracking & Hearings) */
router.patch("/:id/management", auth(["lawyer"]), async (req, res) => {
  try {
    const { status, hearingDate, courtLocation, updateNote, nextSteps, verdict } = req.body;
    const targetCase = await Case.findOne({ _id: req.params.id, assignedLawyer: req.user.id })
      .populate("user", "name");

    if (!targetCase) return res.status(404).json({ message: "Case not found or unauthorized." });

    if (status) targetCase.status = status;
    if (hearingDate) targetCase.hearingDate = hearingDate;
    if (courtLocation) targetCase.courtLocation = courtLocation;
    if (nextSteps !== undefined) targetCase.nextSteps = nextSteps;
    if (verdict !== undefined) targetCase.verdict = verdict;

    if (updateNote) {
      targetCase.trackingHistory.push({ status: updateNote, date: new Date() });
    }

    await targetCase.save();

    // 🔔 Real-time push to citizen
    const io = req.app.get("io");
    if (io && targetCase.user?._id) {
      io.to(targetCase.user._id.toString()).emit("notification", {
        text: `Case Update: "${targetCase.title}" — ${updateNote || status || "Your case has been updated by your advocate."}`
      });
    }

    res.json({ message: "Case information updated!", targetCase });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Get Case Details (Authenticated & Scoped) */
router.get("/details/:id", auth(), async (req, res) => {
  try {
    const targetCase = await Case.findById(req.params.id)
      .populate("user", "name")
      .populate("assignedLawyer", "name");
    
    if (!targetCase) return res.status(404).json({ message: "Case not found." });

    // ✅ SCOPED ACCESS: Only owner, assigned lawyer, or admin
    const isOwner = targetCase.user?._id.toString() === req.user.id;
    const isAssigned = targetCase.assignedLawyer?._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAssigned && !isAdmin) {
       return res.status(403).json({ message: "Access denied: You are not authorized to view this legal file." });
    }

    res.json(targetCase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* GET AI Brief for a case (Assigned Lawyer only) */
router.get("/:id/ai-brief", auth(["lawyer", "admin"]), async (req, res) => {
  try {
    const targetCase = await Case.findById(req.params.id);
    if (!targetCase) return res.status(404).json({ message: "Case not found" });

    // Send to Python AI Service
    const axios = require("axios");
    const aiRes = await axios.post("http://127.0.0.1:8000/brief", {
       description: targetCase.description
    });

    res.json({ brief: aiRes.data.brief });
  } catch (err) {
    console.error("AI Brief Error:", err);
    res.status(500).json({ message: "AI is currently busy processing other cases. Try again later." });
  }
});

/* AI Analysis: Generate Title & Category from Description */
router.post("/analyze-story", auth(), async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.length < 10) {
      return res.status(400).json({ message: "Description too short to analyze." });
    }

    // 🚀 ADVANCED LEGAL TRIAGE (Groq Llama 3.3 with Strict Taxonomy)
    const GROQ_KEY = process.env.GROQ_API_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    
    const TAXONOMY = {
      "Civil": ["property dispute", "land ownership dispute", "partition suit", "breach of contract", "agreement violation", "money recovery", "loan recovery", "consumer complaint", "defective product", "deficient service", "injunction case", "defamation (civil)", "tenant dispute", "rent dispute", "easement rights", "right of way dispute", "specific performance of contract", "negligence claim", "damage compensation"],
      "Criminal": ["theft", "robbery", "burglary", "assault", "hurt case", "attempt to murder", "murder", "culpable homicide", "cheating", "fraud", "domestic violence (criminal)", "sexual harassment", "rape", "kidnapping", "abduction", "drug offense", "cybercrime (criminal)", "rioting", "public nuisance"],
      "Corporate": ["company law violation", "shareholder dispute", "insolvency case", "bankruptcy case", "merger dispute", "acquisition dispute", "corporate fraud", "mismanagement", "director liability", "sebi violation", "compliance issue", "intellectual property dispute", "partnership dispute"],
      "Family": ["divorce", "mutual divorce", "child custody", "maintenance", "alimony", "domestic violence (family)", "adoption dispute", "guardianship", "dowry harassment", "conjugal rights"],
      "Labor": ["unpaid salary", "salary not paid", "pending wages", "wrongful termination", "employee harassment", "workplace harassment", "employment contract dispute", "pf issue", "gratuity issue", "bonus dispute", "overtime not paid", "illegal deduction", "industrial dispute", "layoff issue", "workplace discrimination"],
      "Taxation": ["income tax dispute", "gst dispute", "tax evasion", "customs duty issue", "corporate tax issue", "tax penalty", "assessment dispute", "tax refund issue"],
      "Cyber": ["online fraud", "internet scam", "hacking", "unauthorized access", "identity theft", "phishing", "cyber stalking", "online harassment", "data breach", "privacy violation", "social media defamation", "otp fraud", "banking fraud", "upi fraud", "credit card fraud"]
    };

    const analysisPrompt = `You are a Senior Legal Expert. Analyze this legal incident (which might be in any of 22 Indian languages) and provide a JSON response.
    
    STRICT TAXONOMY MAPPING:
    ${JSON.stringify(TAXONOMY, null, 2)}
    
    YOUR GOAL:
    1. "title": Create a high-impact, professional legal title.
    2. "category": The high-level matter (e.g., "Job & Salary", "Home & Property").
    3. "legalType": Select EXACTLY one from: "Civil", "Criminal", "Corporate", "Family", "Labor", "Taxation", "Cyber".
    4. "incidentDate": Extract the date of occurrence if mentioned (YYYY-MM-DD). If not clear, return null.
    
    STORY: ${description}
    
    RESPONSE FORMAT: {"title": "...", "category": "...", "legalType": "...", "incidentDate": "..."}`;

    try {
      if (GROQ_KEY) {
        console.log("⚡ [AI TRIAGE] Analyzing Multilingual Story with Groq...");
        const groqRes = await axios.post(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: analysisPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.1
          },
          { headers: { Authorization: `Bearer ${GROQ_KEY}` } }
        );
        const data = JSON.parse(groqRes.data.choices[0].message.content);
        return res.json({ 
          title: data.title, 
          category: data.category, 
          legalType: data.legalType,
          incidentDate: data.incidentDate
        });
      }

      // Fallback to Gemini if no Groq
      console.log("✨ Analyzing Story with Gemini Fallback...");
      const genRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        { contents: [{ parts: [{ text: analysisPrompt + "\n\nOutput only raw JSON." }] }] }
      );
      const rawText = genRes.data.candidates[0].content.parts[0].text;
      const data = JSON.parse(rawText.replace(/```json|```/g, ""));
      return res.json({ 
        title: data.title, 
        category: data.category, 
        legalType: data.legalType,
        incidentDate: data.incidentDate
      });

    } catch (aiErr) {
      console.warn("AI Analysis Service down, using fallback heuristic.");
      const words = description.split(" ");
      const fallbackTitle = words.slice(0, 5).join(" ") + "...";
      res.json({ title: fallbackTitle, category: "General Legal", legalType: "Civil", incidentDate: null });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
