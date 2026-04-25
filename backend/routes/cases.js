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

    // 🚀 DIRECT AI ANALYSIS (Groq Llama 3.3)
    const GROQ_KEY = process.env.GROQ_API_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    
    const analysisPrompt = `Analyze this legal incident and provide a JSON response with:
    1. "title": A professional, high-impact legal title (e.g., "Recovery of Unpaid Salary under Labour Laws").
    2. "category": The most appropriate category (e.g., "Job & Salary", "Home & Property", "Money & Loans").
    
    STORY: ${description}
    
    RESPONSE FORMAT: {"title": "...", "category": "..."}`;

    try {
      if (GROQ_KEY) {
        console.log("⚡ Analyzing Story with Groq...");
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
        return res.json({ title: data.title, category: data.category });
      }

      // Fallback to Gemini if no Groq
      console.log("✨ Analyzing Story with Gemini Fallback...");
      const genRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        { contents: [{ parts: [{ text: analysisPrompt + "\n\nOutput only raw JSON." }] }] }
      );
      const rawText = genRes.data.candidates[0].content.parts[0].text;
      const data = JSON.parse(rawText.replace(/```json|```/g, ""));
      return res.json({ title: data.title, category: data.category });

    } catch (aiErr) {
      console.warn("AI Analysis Service down, using fallback heuristic.");
      const words = description.split(" ");
      const fallbackTitle = words.slice(0, 5).join(" ") + "...";
      res.json({ title: fallbackTitle, category: "General Legal" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
