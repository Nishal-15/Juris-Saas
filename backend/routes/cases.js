const router = require("express").Router();
const Case = require("../models/Case");
const User = require("../models/User");
const Lawyer = require("../models/Lawyer");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const axios = require("axios");
const checkSub = require("../middleware/checkSubscription");

/* Create Case */
router.post("/", auth(), async (req, res) => {
  try {
    const { title, description, type, urgency, category, legalType, incidentDate } = req.body;

    const newCase = new Case({
      title,
      description,
      type: type || legalType,
      category,
      legalType,
      incidentDate,
      urgency: urgency || "Normal",
      user: req.user.id,
      assignedLawyer: null
    });

    await newCase.save();

    // EXPERT MATCHING
    let matchedLawyers = [];
    try {
      matchedLawyers = await Lawyer.find({
        specialization: { $regex: legalType || "", $options: "i" }
      }).limit(3).select("name specialization rating experience photo");
    } catch (e) {}

    const io = req.app.get("io");
    if (io) io.emit("marketplace-needs-refresh");

    res.json({ 
      case: newCase, 
      suggestedLawyers: matchedLawyers 
    });

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

    // LASER-FOCUS: Only check 'Type' and 'Title' — avoid Description bleed
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

    // FALLBACK: If expert filter returned nothing OR is too limited, show all open cases
    if (openCases.length < 5 && query.$or) {
       const allOpen = await Case.find({ assignedLawyer: null })
         .populate("user", "name")
         .sort({ createdAt: -1 });
       
       // Deduplicate: merge filtered + all, keeping all
       return res.json(allOpen);
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

    // Update Lawyer Case Count Metrics
    await Lawyer.findByIdAndUpdate(req.user.id, { $inc: { casesClaimedCount: 1 } });

    // BROADCAST: Case Claimed! Refresh other marketplaces
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

    // Update Lawyer Case Count
    await Lawyer.findByIdAndUpdate(req.user.id, { $inc: { casesClaimedCount: 1 } });

    targetCase.assignedLawyer = req.user.id;
    targetCase.status = "In Progress";
    await targetCase.save();

    // BROADCAST: Case Claimed! Refresh other marketplaces
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

    // Real-time push to citizen
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

    // SCOPED ACCESS: Only owner, assigned lawyer, or admin
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

    // COURTROOM-READY LEGAL TRIAGE (Groq Llama 3.3 with Detailed Taxonomy)
    const GROQ_KEY = process.env.GROQ_API_KEY;
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    
    const TAXONOMY_TITLES = {
      "Civil": {
        "property dispute": "Suit for Declaration and Permanent Injunction in Property Dispute",
        "land ownership dispute": "Suit for Declaration of Title and Ownership of Land",
        "partition suit": "Suit for Partition and Separate Possession",
        "breach of contract": "Suit for Damages for Breach of Contract",
        "agreement violation": "Suit for Enforcement of Agreement and Damages",
        "money recovery": "Suit for Recovery of Money",
        "loan recovery": "Suit for Recovery of Loan Amount",
        "consumer complaint": "Complaint for Deficiency in Service under Consumer Protection Law",
        "defective product": "Complaint for Defective Product and Compensation",
        "deficient service": "Complaint for Deficiency in Service",
        "injunction case": "Suit for Permanent and Mandatory Injunction",
        "defamation (civil)": "Suit for Damages for Defamation",
        "tenant dispute": "Suit for Eviction and Tenant Dispute Resolution",
        "rent dispute": "Suit for Recovery of Rent and Eviction",
        "easement rights": "Suit for Enforcement of Easement Rights",
        "right of way dispute": "Suit for Declaration of Right of Way and Injunction",
        "specific performance of contract": "Suit for Specific Performance of Contract",
        "negligence claim": "Suit for Compensation for Negligence",
        "damage compensation": "Suit for Recovery of Damages and Compensation"
      },
      "Criminal": {
        "theft": "Complaint for Theft under Criminal Law",
        "robbery": "Complaint for Robbery under Criminal Law",
        "burglary": "Complaint for Burglary and House Trespass",
        "assault": "Complaint for Assault and Criminal Force",
        "hurt case": "Complaint for Causing Hurt",
        "attempt to murder": "Complaint for Attempt to Murder",
        "murder": "Complaint for Murder",
        "culpable homicide": "Complaint for Culpable Homicide",
        "cheating": "Complaint for Cheating and Dishonest Inducement",
        "fraud": "Complaint for Fraud and Criminal Misrepresentation",
        "domestic violence (criminal)": "Complaint for Domestic Violence under Criminal Law",
        "sexual harassment": "Complaint for Sexual Harassment",
        "rape": "Complaint for Rape",
        "kidnapping": "Complaint for Kidnapping",
        "abduction": "Complaint for Abduction",
        "drug offense": "Complaint for Drug Offense under NDPS Act",
        "cybercrime (criminal)": "Complaint for Cybercrime under IT Act",
        "rioting": "Complaint for Rioting and Unlawful Assembly",
        "public nuisance": "Complaint for Public Nuisance"
      },
      "Corporate": {
        "company law violation": "Petition for Violation of Company Law",
        "shareholder dispute": "Petition for Resolution of Shareholder Dispute",
        "insolvency case": "Application for Initiation of Insolvency Proceedings",
        "bankruptcy case": "Petition for Bankruptcy Proceedings",
        "merger dispute": "Petition for Dispute in Merger Proceedings",
        "acquisition dispute": "Petition for Dispute in Acquisition Transaction",
        "corporate fraud": "Complaint for Corporate Fraud",
        "mismanagement": "Petition for Oppression and Mismanagement",
        "director liability": "Petition for Fixing Director Liability",
        "sebi violation": "Complaint for SEBI Regulation Violation",
        "compliance issue": "Petition for Non-Compliance of Regulatory Requirements",
        "intellectual property dispute": "Suit for Intellectual Property Rights Infringement",
        "partnership dispute": "Suit for Resolution of Partnership Dispute"
      },
      "Family": {
        "divorce": "Petition for Divorce",
        "mutual divorce": "Petition for Mutual Consent Divorce",
        "child custody": "Petition for Child Custody",
        "maintenance": "Petition for Maintenance",
        "alimony": "Petition for Grant of Alimony",
        "domestic violence (family)": "Complaint under Domestic Violence Act",
        "adoption dispute": "Petition for Adoption Dispute Resolution",
        "guardianship": "Petition for Guardianship",
        "dowry harassment": "Complaint for Dowry Harassment",
        "conjugal rights": "Petition for Restitution of Conjugal Rights"
      },
      "Labor": {
        "unpaid salary": "Claim for Recovery of Unpaid Salary",
        "salary not paid": "Claim for Non-Payment of Salary",
        "pending wages": "Claim for Recovery of Pending Wages",
        "wrongful termination": "Claim for Wrongful Termination",
        "employee harassment": "Complaint for Employee Harassment at Workplace",
        "workplace harassment": "Complaint for Workplace Harassment",
        "employment contract dispute": "Claim for Breach of Employment Contract",
        "pf issue": "Complaint for Non-Payment of Provident Fund",
        "gratuity issue": "Claim for Non-Payment of Gratuity",
        "bonus dispute": "Claim for Non-Payment of Bonus",
        "overtime not paid": "Claim for Non-Payment of Overtime Wages",
        "illegal deduction": "Complaint for Illegal Salary Deduction",
        "industrial dispute": "Industrial Dispute Petition",
        "layoff issue": "Complaint for Illegal Layoff",
        "workplace discrimination": "Complaint for Workplace Discrimination"
      },
      "Taxation": {
        "income tax dispute": "Appeal for Income Tax Dispute",
        "gst dispute": "Appeal for GST Dispute",
        "tax evasion": "Complaint for Tax Evasion",
        "customs duty issue": "Appeal for Customs Duty Dispute",
        "corporate tax issue": "Appeal for Corporate Tax Dispute",
        "tax penalty": "Appeal against Tax Penalty",
        "assessment dispute": "Appeal against Tax Assessment Order",
        "tax refund issue": "Application for Tax Refund Claim"
      },
      "Cyber": {
        "online fraud": "Complaint for Online Fraud",
        "internet scam": "Complaint for Internet Scam",
        "hacking": "Complaint for Hacking and Unauthorized Access",
        "unauthorized access": "Complaint for Unauthorized Access to System",
        "identity theft": "Complaint for Identity Theft",
        "phishing": "Complaint for Phishing Fraud",
        "cyber stalking": "Complaint for Cyber Stalking",
        "online harassment": "Complaint for Online Harassment",
        "data breach": "Complaint for Data Breach",
        "privacy violation": "Complaint for Violation of Data Privacy",
        "social media defamation": "Complaint for Defamation on Social Media",
        "otp fraud": "Complaint for OTP Fraud",
        "banking fraud": "Complaint for Online Banking Fraud",
        "upi fraud": "Complaint for UPI Fraud",
        "credit card fraud": "Complaint for Credit Card Fraud"
      }
    };

    const analysisPrompt = `You are a Senior Legal Expert. Analyze this incident and provide a JSON response.
    
    COURTROOM-READY MAPPING:
    ${JSON.stringify(TAXONOMY_TITLES, null, 2)}
    
    YOUR GOAL:
    1. "title": You MUST use the EXACT formal title from the mapping above if the story matches a sub-topic. If no match, create a similar formal title.
    2. "category": The high-level matter (e.g., "Job & Salary").
    3. "legalType": Select the parent category from the mapping (Civil, Criminal, etc.).
    
    STORY: ${description}
    
    RESPONSE FORMAT: {"title": "...", "category": "...", "legalType": "..."}`;

    try {
      if (GROQ_KEY) {
        console.log("[AI TRIAGE] Attempting Groq Analysis...");
        try {
          const groqRes = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: analysisPrompt }],
              response_format: { type: "json_object" },
              temperature: 0.1
            },
            { headers: { Authorization: `Bearer ${GROQ_KEY}` }, timeout: 10000 }
          );
          const data = JSON.parse(groqRes.data.choices[0].message.content);
          console.log("[AI TRIAGE] Groq Success:", data.title);
          return res.json({ 
            title: data.title, 
            category: data.category, 
            legalType: data.legalType
          });
        } catch (err) {
          console.error("[AI TRIAGE] Groq Failed:", err.response?.data || err.message);
        }
      }

      // Fallback to Gemini if no Groq or Groq fails
      if (GEMINI_KEY) {
        console.log("[AI TRIAGE] Attempting Gemini Fallback...");
        try {
          const genRes = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
            { contents: [{ parts: [{ text: analysisPrompt + "\n\nOutput only raw JSON." }] }] },
            { timeout: 15000 }
          );
          let rawText = genRes.data.candidates[0].content.parts[0].text;
          // Clean markdown JSON if present
          rawText = rawText.replace(/```json|```/g, "").trim();
          const data = JSON.parse(rawText);
          console.log("[AI TRIAGE] Gemini Success:", data.title);
          return res.json({ 
            title: data.title, 
            category: data.category, 
            legalType: data.legalType
          });
        } catch (err) {
          console.error("[AI TRIAGE] Gemini Failed:", err.response?.data || err.message);
        }
      }

      throw new Error("All AI Engines failed to respond.");

    } catch (aiErr) {
      console.warn("[AI TRIAGE] CRITICAL: Using heuristic fallback due to AI failure.");
      const words = description.split(" ").filter(w => w.length > 0);
      const fallbackTitle = words.slice(0, 7).join(" ") + "...";
      res.json({ title: fallbackTitle, category: "General Legal", legalType: "Civil" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* CONNECT: Client requests a lawyer */
router.post("/connect/:caseId/:lawyerId", auth(), async (req, res) => {
  try {
    const { caseId, lawyerId } = req.params;
    
    // Set status to 'Pending Expert Acceptance' - Lawyer is NOT officially assigned yet
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { 
        assignedLawyer: lawyerId,
        status: "Pending Expert Acceptance",
        $push: { trackingHistory: { status: "Connection Requested", date: new Date() } }
      },
      { new: true }
    ).populate("user", "name");

    // PERSIST NOTIFICATION FOR LAWYER
    await Notification.create({
      user: lawyerId,
      title: "New Consultation Request",
      message: `You have received a new consultation request for the case: ${updatedCase.title}.`,
      icon: "file-text"
    });

    // NOTIFY LAWYER: Send real-time request to the Consultation Queue
    const io = req.app.get("io");
    if (io) {
      io.to(lawyerId).emit("notification", {
        text: "New Consultation Request! Please check your queue.",
        type: "new_request"
      });
      // Also trigger a silent refresh for the lawyer dashboard if they are on it
      io.emit("marketplace-needs-refresh");
    }

    console.log(`Request Sent: Case ${caseId} -> Lawyer ${lawyerId} (Pending Approval)`);
    res.json({ message: "Request Sent to Expert", case: updatedCase });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* Lawyer: List PENDING REQUESTS (Consultation Queue) */
router.get("/requested", auth(["lawyer"]), async (req, res) => {
  try {
    const lawyerId = req.user.id;
    
    // Find cases specifically assigned to this lawyer that are awaiting acceptance
    const requestedCases = await Case.find({ 
      assignedLawyer: lawyerId,
      status: { $in: ["Pending Expert Acceptance", "Requested"] } 
    }).populate("user", "name");

    console.log(`Found ${requestedCases.length} direct requests for Lawyer ${lawyerId}`);
    res.json(requestedCases);

  } catch (err) {
    console.error("Requested cases error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* Lawyer: List assigned cases (Active Workspace) */
router.get("/my", auth(["lawyer"]), async (req, res) => {
  try {
    const lawyerId = req.user.id;
    const activeStatuses = ["In Progress", "Hearing Scheduled", "Verdict Pending"];
    
    const cases = await Case.find({ 
      assignedLawyer: lawyerId,
      status: { $in: activeStatuses }
    }).populate("user", "name");
    
    res.json(cases);
  } catch (err) {
    console.error("My cases error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ACCEPT: Lawyer accepts the client request */
router.post("/accept/:caseId", auth(["lawyer"]), async (req, res) => {
  try {
    const { caseId } = req.params;
    
    // Officially set status to 'In Progress' and confirm the lawyer
    const acceptedCase = await Case.findByIdAndUpdate(
      caseId,
      { 
        status: "In Progress",
        $push: { trackingHistory: { status: "Lawyer Accepted", date: new Date() } }
      },
      { new: true }
    ).populate("user", "name");

    // PERSIST NOTIFICATION FOR CITIZEN
    await Notification.create({
      user: acceptedCase.user?._id,
      title: "Request Accepted",
      message: "Great news! Your expert has accepted the case and is ready to consult.",
      icon: "check-circle"
    });

    // NOTIFY CLIENT: Their expert is ready real-time
    const io = req.app.get("io");
    if (io && acceptedCase.user?._id) {
      io.to(acceptedCase.user._id.toString()).emit("notification", {
        text: "Great news! Your expert has accepted the case and is ready to consult.",
        type: "case_accepted"
      });
    }

    console.log(`Case Accepted: ${caseId} by Lawyer ${req.user.id}`);
    res.json({ message: "Case Accepted Successfully", case: acceptedCase });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
