const router = require("express").Router();
const Case = require("../models/Case");
const User = require("../models/User");
const Lawyer = require("../models/Lawyer");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const axios = require("axios");
const checkSub = require("../middleware/checkSubscription");
const { sendAIWhatsApp } = require("../utils/notifier");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  getAIChatURL,
  getAIMediationURL,
  getAIMediationStatusURL
} = require("../utils/aiUrl");

// ✅ Evidence Upload Config
const evidenceStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/evidence');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const uploadEvidence = multer({
  storage: evidenceStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf|mp4|mov|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) cb(null, true);
    else cb(null, false); // Skip unsupported silently
  }
}).array('evidence', 10); // Max 10 files

function detectComplexity(legalType,
  urgency, type) {
  const text = (
    (legalType||"")+" "+(type||"")+" "+
    (urgency||"")
  ).toLowerCase()
  if (
    urgency==="Emergency"||
    text.includes("murder")||
    text.includes("rape")||
    text.includes("constitutional")||
    text.includes("corporate")||
    text.includes("terrorism")
  ) return "High"
  if (
    text.includes("consumer")||
    text.includes("tenant")||
    text.includes("rent")||
    text.includes("maintenance")||
    text.includes("cheque bounce")||
    text.includes("insurance")||
    text.includes("neighbour")
  ) return "Low"
  return "Mid"
}

function detectCourtLevel(legalType, type, complexity) {
  const text = ((legalType || "") + " " + (type || "")).toLowerCase()

  if (
    text.includes("supreme") ||
    text.includes("constitutional") ||
    text.includes("fundamental right") ||
    text.includes("writ petition") ||
    text.includes("special leave") ||
    text.includes("slp")
  ) return "Supreme Court"

  if (
    text.includes("high court") ||
    text.includes("corporate") ||
    text.includes("taxation") ||
    text.includes("gst") ||
    text.includes("income tax") ||
    text.includes("customs") ||
    text.includes("sebi") ||
    (text.includes("property") && complexity === "High")
  ) return "High Court"

  if (
    text.includes("consumer") ||
    text.includes("deficiency") ||
    text.includes("defective")
  ) return "Consumer Forum"

  if (
    text.includes("family") ||
    text.includes("divorce") ||
    text.includes("custody") ||
    text.includes("matrimonial") ||
    text.includes("alimony") ||
    text.includes("maintenance") ||
    text.includes("dowry")
  ) return "Family Court"

  if (
    text.includes("labor") ||
    text.includes("labour") ||
    text.includes("employment") ||
    text.includes("industrial") ||
    text.includes("salary") ||
    text.includes("wages") ||
    text.includes("termination") ||
    text.includes("provident fund") ||
    text.includes("gratuity") ||
    text.includes("tribunal") ||
    text.includes("nclt") ||
    text.includes("drt") ||
    text.includes("cat") ||
    text.includes("cyber") ||
    text.includes("online fraud")
  ) return "Tribunal"

  return "District Court"
}

function getCourtExplanation(courtLevel) {
  const map = {
    "Supreme Court": {
      why: "Involves fundamental rights, constitutional questions, or national jurisdiction.",
      timeline: "1–3 years (initial admission hearing within weeks)",
      estimatedCost: "₹50,000 – ₹5,00,000+",
      nextStep: "File Writ Petition or Special Leave Petition (SLP) with certified case record."
    },
    "High Court": {
      why: "Involves substantial questions of law, state-level jurisdiction, or statutory appeals.",
      timeline: "1–2 years",
      estimatedCost: "₹25,000 – ₹2,00,000",
      nextStep: "Engage High Court advocate to file Writ Petition or Civil/Criminal Appeal."
    },
    "Consumer Forum": {
      why: "Dispute arises from purchase of goods or services with deficiency or defect.",
      timeline: "6–18 months",
      estimatedCost: "₹2,000 – ₹25,000",
      nextStep: "Issue statutory legal notice to seller/service provider before filing."
    },
    "Family Court": {
      why: "Matrimonial dispute, divorce, child custody, alimony, or domestic relations.",
      timeline: "6 months – 2 years (6 months mandatory cooling-off for mutual divorce)",
      estimatedCost: "₹10,000 – ₹1,00,000",
      nextStep: "File petition before Family Court with marriage certificate and address proof."
    },
    "Tribunal": {
      why: "Specialized subject matter requiring expert tribunal jurisdiction (Labor, NCLT, DRT, CAT, Cyber).",
      timeline: "6–18 months",
      estimatedCost: "₹15,000 – ₹1,50,000",
      nextStep: "File application before relevant tribunal with supporting documents and fee."
    },
    "District Court": {
      why: "Civil suit or criminal complaint within territorial and pecuniary district jurisdiction.",
      timeline: "1–3 years",
      estimatedCost: "₹10,000 – ₹75,000",
      nextStep: "Engage local district advocate to draft plaint or criminal complaint."
    }
  };
  return map[courtLevel] || map["District Court"];
}

function detectFeeRange(incomeTier,
  complexity) {
  const ranges = {
    low: {
      Low:  {min:500,   max:5000   },
      Mid:  {min:1000,  max:10000  },
      High: {min:2000,  max:15000  }
    },
    mid: {
      Low:  {min:2000,  max:15000  },
      Mid:  {min:5000,  max:50000  },
      High: {min:10000, max:100000 }
    },
    high: {
      Low:  {min:10000, max:50000  },
      Mid:  {min:25000, max:200000 },
      High: {min:50000, max:999999 }
    }
  }
  return ranges[incomeTier]?.[complexity]||
    {min:0, max:999999}
}

function mapIncomeToLawyerTier(incomeTier) {
  const map = {
    low:  ["tier3"],
    mid:  ["tier2","tier3"],
    high: ["tier1","tier2"]
  }
  return map[incomeTier]||["tier2","tier3"]
}

/* Create Case */
router.post("/", auth(), (req, res, next) => {
  uploadEvidence(req, res, (err) => {
    if (err && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Each evidence file must be under 20MB.' });
    }
    next(); // Continue even if no files
  });
}, async (req, res) => {
  try {
    const { title, description, type, urgency, category, legalType, incidentDate } = req.body;
    const citizen = await User.findById(req.user.id);

if (!title || title.trim().length < 3) {
  return res.status(400).json({
    message: "Case title must be " +
      "at least 3 characters."
  })
}
if (!description ||
    description.trim().length < 20) {
  return res.status(400).json({
    message: "Please describe your " +
      "case in at least 20 characters."
  })
}
/* Sanitize inputs */
const sanitized = {
  title:       title.trim().slice(0, 200),
  description: description.trim()
    .slice(0, 5000),
  type:        (type || "").trim()
    .slice(0, 100),
  legalType:   (legalType || "").trim()
    .slice(0, 100),
  category:    (category || "").trim()
    .slice(0, 100),
}

    const isMediationReq = (req.body.mediationRequested === "true" || req.body.mediationRequested === true);

    const newCase = new Case({
      title: sanitized.title,
      description: sanitized.description,
      type: sanitized.type || sanitized.legalType,
      category: sanitized.category,
      legalType: sanitized.legalType,
      incidentDate,
      urgency: urgency || "Normal",
      status: isMediationReq ? "Pending Mediation" : "Open",
      isMediationTrack: isMediationReq,
      user: req.user.id,
      assignedLawyer: null,
      // ✅ Store evidence file paths
      evidence: (req.files || []).map(f => `/uploads/evidence/${f.filename}`)
    });

    await newCase.save();

    // EXPERT MATCHING
    let matchedLawyers  = []
    let mediationResult = null
    try {
      const citizen = await User.findById(
        req.user.id
      ).select("incomeTier state city name phone email")
      const incomeTier =
        citizen?.incomeTier || "mid"
      const complexity  = detectComplexity(
        legalType, urgency, type
      )
      const courtLevel  = detectCourtLevel(
        legalType, type, complexity
      )
      const feeRange    = detectFeeRange(
        incomeTier, complexity
      )
      const lawyerTiers =
        mapIncomeToLawyerTier(incomeTier)

      newCase.complexity        = complexity
      newCase.courtLevel        = courtLevel
      newCase.clientIncomeTier  = incomeTier
      newCase.estimatedFeeRange = feeRange
      newCase.courtExplanation  = getCourtExplanation(newCase.courtLevel)
      await newCase.save()

      /* PRIMARY MATCH — exact legalType match, respecting tier */
      const specializationKeyword = isMediationReq
        ? "Mediation|Arbitration" 
        : (legalType || type || "").replace(" Law", "").replace(" Protection", "").trim();

      matchedLawyers = await Lawyer.find({
        isVerified: true,
        isBlocked:  false,
        tier:       { $in: lawyerTiers },
        specialization: {
          $regex:   specializationKeyword,
          $options: "i"
        }
      })
      .sort({ rating: -1, casesClaimedCount: 1 })
      .limit(5)
      .select("name specialization rating " +
        "experience tier minFeePerCase " +
        "maxFeePerCase courtLevels city " +
        "state photo email")

      /* FALLBACK 1 — relax tier, keep specialization filter */
      if (matchedLawyers.length < 3) {
        matchedLawyers = await Lawyer.find({
          isVerified: true,
          isBlocked:  false,
          specialization: {
            $regex:   specializationKeyword,
            $options: "i"
          }
        })
        .sort({ rating: -1 })
        .limit(5)
        .select("name specialization rating " +
          "experience tier minFeePerCase " +
          "maxFeePerCase courtLevels city " +
          "state photo email")
      }

      /* FALLBACK 2 — only if ZERO specialists found: top rated general advocates */
      if (matchedLawyers.length === 0) {
        matchedLawyers = await Lawyer.find({
          isVerified: true,
          isBlocked:  false
        })
        .sort({ rating: -1 })
        .limit(3)
        .select("name specialization rating " +
          "experience tier minFeePerCase " +
          "maxFeePerCase photo email")
      }

      /* MEDIATION CHECK */
      try {
        const medRes = await axios.post(
          getAIMediationURL(),
          {
            caseTitle:   newCase.title,
            caseType:    newCase.type ||
                         newCase.legalType || "",
            citizenName: citizen?.name || "User",
            lang:        req.body.lang || "auto",
            userInput:   newCase.description || ""
          },
          { timeout: 30000 }
        )
        if (medRes.data.eligible) {
          newCase.isMediationEligible =
            true
          newCase.mediationScript =
            medRes.data.script
          newCase.mediationVideoUrl =
            medRes.data.videoUrl
          await newCase.save()
          mediationResult = medRes.data

          /* WhatsApp alert to citizen */
          if (citizen?.phone) {
            const {
              sendMediationAlert
            } = require("../utils/whatsapp")
            sendMediationAlert({
              to:          citizen.phone,
              citizenName: citizen.name,
              caseTitle:   newCase.title,
              lang:        citizen.preferredLanguage || "en"
            })
          }
        }
      } catch (medErr) {
        console.error(
          "Mediation check error:", medErr.message
        )
      }

    } catch (matchErr) {
      console.error(
        "Tier Matching Error:", matchErr
      )
    }

    const io = req.app.get("io");
    if (io) io.emit("marketplace-needs-refresh");

    /* 📧 SEND EMAIL NOTIFICATIONS (CITIZEN & LAWYERS) */
    try {
      const { sendEmail, caseFiledCitizenTemplate, caseFiledLawyerNotificationTemplate } = require("../utils/mailer");
      if (citizen?.email) {
        sendEmail({
          to: citizen.email,
          ...caseFiledCitizenTemplate(citizen.name, newCase.title, newCase._id, newCase.urgency)
        }).catch(e => console.error("Citizen case filed email failed:", e));
      }
      if (matchedLawyers && matchedLawyers.length > 0) {
        for (const l of matchedLawyers) {
          if (l.email) {
            sendEmail({
              to: l.email,
              ...caseFiledLawyerNotificationTemplate(l.name, citizen?.name || "Client", newCase.title, newCase.urgency, newCase._id)
            }).catch(e => console.error("Lawyer case alert email failed:", e));
          }
        }
      }
    } catch (mailErr) {
      console.error("Case notification emails error:", mailErr.message);
    }

    const specKeyword = (newCase.legalType || newCase.type || "").replace(" Law", "").replace(" Protection", "").trim();
    const enrichedLawyers = matchedLawyers.map(l => {
      const lawyerObj = l.toObject ? l.toObject() : l;
      const isDirect = (lawyerObj.specialization || "").toLowerCase().includes(specKeyword.toLowerCase());
      const isMediationMatch = isMediationReq;
      
      return {
        ...lawyerObj,
        isDirectMatch: isDirect || isMediationMatch,
        matchExplanation: isMediationMatch
          ? `Certified ADR Professional · Primary specialization: ${lawyerObj.specialization || "General Practice"}. Qualified to act as a neutral third-party mediator for this dispute.`
          : isDirect
            ? `Direct Specialist in ${specKeyword} Law`
            : `Cross-Specialization Expert · Primary specialization: ${lawyerObj.specialization || "General Practice"}. Certified to handle ${specKeyword} matters, settlement drafting, and court filings.`,
        capablePracticeAreas: isMediationMatch
          ? ["Pre-Litigation Mediation", "Arbitration & Conciliation", "Settlement Drafting"]
          : isDirect
            ? [`${specKeyword} Law`, "Court Litigation", "Legal Counseling"]
            : [`${specKeyword} Disputes & Filings`, "Civil & District Court Representation", "Settlement Drafting", lawyerObj.specialization || "General Litigation"]
      };
    });

    res.json({
      case: newCase,
      suggestedLawyers: enrichedLawyers,
      matchingInfo: {
        complexity:   newCase.complexity,
        courtLevel:   newCase.courtLevel,
        incomeTier:   newCase.clientIncomeTier,
        feeRange:     newCase.estimatedFeeRange
      },
      mediationEligible:
        newCase.isMediationEligible,
      mediationInfo: mediationResult || null
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
    if (io) {
      io.emit("marketplace-needs-refresh");
      
      // ✅ TARGETED PUSH: Tell the citizen immediately so their UI auto-refreshes
      if (targetCase.user) {
        io.to(targetCase.user.toString()).emit("notification", {
          text: "A Legal Expert has accepted your case!",
          type: "case_assigned"
        });
      }
    }

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

    // 📧 EMAIL: Send AI alert for status update
    const citizen = await User.findById(targetCase.user?._id);
    if (citizen && citizen.email) {
       sendAIWhatsApp(citizen.email, citizen.name, targetCase.title, "case_update");
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

    // SCOPED ACCESS: Only owner, assigned lawyer, admin, OR verified lawyers if case is open/unassigned
    const isOwner = targetCase.user?._id.toString() === req.user.id;
    const isAssigned = targetCase.assignedLawyer?._id.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    const isOpenMarketplaceCase = !targetCase.assignedLawyer && req.user.role === "lawyer";

    if (!isOwner && !isAssigned && !isAdmin && !isOpenMarketplaceCase) {
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
    const aiUrl = process.env.PYTHON_AI_SERVICE_URL.replace('/chat', '/brief');
    const aiRes = await axios.post(aiUrl, {
       description: targetCase.description
    });

    res.json({ brief: aiRes.data.brief });
  } catch (err) {
    console.error("AI Brief Error:", err);
    res.status(500).json({ message: "AI is currently busy processing other cases. Try again later." });
  }
});

function smartHeuristicTriage(description) {
  const text = (description || "").toLowerCase();
  
  // 1. Criminal Law checks (Assault, Hurt, Threats, Police, BNS, IPC, Theft, Fraud)
  if (
    text.includes("assault") || text.includes("hurt") || text.includes("threat") || 
    text.includes("obscene") || text.includes("stick") || text.includes("injury") || 
    text.includes("injuries") || text.includes("police") || text.includes("accused") || 
    text.includes("bns") || text.includes("bharatiya nyaya sanhita") || text.includes("ipc") ||
    text.includes("murder") || text.includes("robbery") || text.includes("theft") || text.includes("criminal")
  ) {
    let title = "Complaint for Voluntarily Causing Hurt and Criminal Intimidation";
    let category = "Assault & Bodily Injury";
    let sections = ["Sec 115(2) BNS (Voluntarily Causing Hurt)", "Sec 351(2) BNS (Criminal Intimidation)", "Sec 352 BNS (Intentional Insult)"];
    let court = "Judicial Magistrate First Class (JMFC) / District Criminal Court";
    
    if (text.includes("theft") || text.includes("robbery") || text.includes("stolen")) {
      title = "Complaint for Theft and Dishonest Misappropriation of Property";
      category = "Theft & Property Crime";
      sections = ["Sec 303 BNS (Theft)", "Sec 316 BNS (Criminal Breach of Trust)"];
    } else if (text.includes("cheating") || text.includes("fraud") || text.includes("scam") || text.includes("deceived") || text.includes("financial dispute")) {
      if (!text.includes("assault") && !text.includes("hurt") && !text.includes("stick")) {
        title = "Complaint for Cheating, Fraud, and Criminal Deception";
        category = "Financial Fraud & Cheating";
        sections = ["Sec 318(4) BNS (Cheating)", "Sec 336(3) BNS (Forgery)"];
      }
    } else if (text.includes("harass") || text.includes("stalk") || text.includes("modesty") || text.includes("sexual")) {
      title = "Complaint for Sexual Harassment and Outraging Modesty";
      category = "Crimes Against Women";
      sections = ["Sec 74 BNS (Assault or Criminal Force to Woman)", "Sec 78 BNS (Stalking)"];
    }

    const draft = `The Complainant humbly submits that on the date of the incident, the Accused wrongfully restrained, verbally abused with obscene language, criminally intimidated, and physically assaulted the Complainant without provocation, causing documented bodily injuries. Despite lodging a formal police complaint and submitting medical evidence, no effective action has been taken. It is respectfully prayed that this Hon'ble Court take cognizance under the relevant provisions of the Bharatiya Nyaya Sanhita, 2023, and issue necessary directions for prosecution and justice.`;

    return {
      title,
      category,
      legalType: "Criminal Law",
      sections,
      court,
      draft
    };
  }

  // 2. Family Law checks (Divorce, Dowry, Custody, Alimony, Maintenance, Domestic Violence)
  if (
    text.includes("divorce") || text.includes("dowry") || text.includes("custody") || 
    text.includes("alimony") || text.includes("maintenance") || text.includes("husband") || 
    text.includes("wife") || text.includes("marriage") || text.includes("matrimonial") || text.includes("domestic violence")
  ) {
    return {
      title: "Petition for Dissolution of Marriage and Matrimonial Dispute Resolution",
      category: "Matrimonial & Family Disputes",
      legalType: "Family Law",
      sections: ["Sec 13 Hindu Marriage Act (Divorce)", "Sec 125 CrPC / Sec 144 BNSS (Maintenance)", "Protection of Women from Domestic Violence Act, 2005"],
      court: "Family Court / Principal Judge Family Court",
      draft: `The Petitioner humbly submits that marital harmony has broken down due to continuous cruelty, harassment, and irreconcilable differences. The Petitioner seeks appropriate intervention, maintenance, and protection of matrimonial rights under the applicable statute. It is prayed that this Hon'ble Court grant the reliefs sought in the interest of justice.`
    };
  }

  // 3. Labor / Employment Law checks (Salary, Wage, Termination, PF, Employer, Employee)
  if (
    text.includes("salary") || text.includes("wage") || text.includes("terminate") || 
    text.includes("employer") || text.includes("employee") || text.includes("job") || 
    text.includes("workplace") || text.includes("provident fund") || text.includes("gratuity") || text.includes("layoff")
  ) {
    return {
      title: "Claim for Recovery of Unpaid Wages and Wrongful Termination",
      category: "Employment & Labor Rights",
      legalType: "Labor Law",
      sections: ["Payment of Wages Act, 1936", "Industrial Disputes Act, 1947", "Shops and Establishments Act"],
      court: "Labor Court / Industrial Tribunal",
      draft: `The Applicant humbly submits that the Employer wrongfully terminated services without statutory notice or due process and withheld legitimately earned salary and dues. Despite repeated reminders, the dues remain unpaid. It is prayed that this Hon'ble Tribunal direct the Employer to release all outstanding arrears along with interest and compensation.`
    };
  }

  // 4. Consumer / Commercial / Cyber checks
  if (text.includes("consumer") || text.includes("defective") || text.includes("service") || text.includes("refund") || text.includes("warranty")) {
    return {
      title: "Complaint for Deficiency in Service and Unfair Trade Practices",
      category: "Consumer Protection",
      legalType: "Consumer Protection",
      sections: ["Sec 35 Consumer Protection Act, 2019", "Sec 2(11) Deficiency in Service"],
      court: "District Consumer Disputes Redressal Commission (DCDRC)",
      draft: `The Complainant submits that the Opposite Party rendered deficient service and engaged in unfair trade practices by failing to fulfill contractual obligations and refusing a legitimate refund. The Complainant seeks full reimbursement of the amount paid along with compensation for mental agony and litigation costs.`
    };
  }

  if (text.includes("cyber") || text.includes("online") || text.includes("hack") || text.includes("otp") || text.includes("bank") || text.includes("upi")) {
    return {
      title: "Complaint for Online Financial Fraud and Cybercrime",
      category: "Cybercrime & Fraud",
      legalType: "Cyber Law",
      sections: ["Sec 66D Information Technology Act, 2000", "Sec 318(4) BNS (Online Cheating)"],
      court: "Adjudicating Officer (IT Act) / Cyber Crime Court",
      draft: `The Complainant states that unknown cyber criminals fraudulently obtained unauthorized access and drained funds via online manipulation. Immediate freezing of destination accounts and investigation under the Information Technology Act is prayed for.`
    };
  }

  // 5. Property / Civil Law
  if (text.includes("property") || text.includes("land") || text.includes("tenant") || text.includes("rent") || text.includes("evict") || text.includes("lease") || text.includes("ownership")) {
    return {
      title: "Suit for Declaration of Title, Permanent Injunction, and Possession",
      category: "Property & Real Estate",
      legalType: "Civil Law",
      sections: ["Specific Relief Act, 1963 (Sec 34 & 38)", "Transfer of Property Act, 1882"],
      court: "Senior Civil Judge / District Civil Court",
      draft: `The Plaintiff submits that the Defendant is interfering with peaceful possession and title over the suit scheduled property without any valid legal right. The Plaintiff prays for a decree of declaration of title and a permanent injunction restraining the Defendant from altering the nature of the property.`
    };
  }

  // 6. Tax Law
  if (text.includes("tax") || text.includes("gst") || text.includes("customs") || text.includes("income tax") || text.includes("tds")) {
    return {
      title: "Appeal against Tax Assessment and Penalty Order",
      category: "Taxation Disputes",
      legalType: "Tax Law",
      sections: ["Income Tax Act, 1961", "Central Goods and Services Tax Act, 2017"],
      court: "Income Tax Appellate Tribunal (ITAT) / GST Tribunal",
      draft: `The Appellant respectfully submits that the impugned assessment order/penalty is bad in law, arbitrary, and contrary to the statutory provisions. It is prayed that the Hon'ble Tribunal quash the demand and grant consequential relief.`
    };
  }

  // 7. Corporate Law
  if (text.includes("corporate") || text.includes("company") || text.includes("shareholder") || text.includes("director") || text.includes("nclt") || text.includes("insolvency") || text.includes("sebi") || text.includes("startup") || text.includes("founder") || text.includes("spa") || text.includes("equity") || text.includes("investment")) {
    return {
      title: "Petition for Oppression, Mismanagement, and Corporate Dispute",
      category: "Corporate & Commercial Law",
      legalType: "Corporate Law",
      sections: ["Companies Act, 2013", "Insolvency and Bankruptcy Code, 2016"],
      court: "National Company Law Tribunal (NCLT)",
      draft: `The Petitioner submits that the affairs of the Respondent Company are being conducted in a manner prejudicial to public interest and oppressive to the minority shareholders. It is prayed that the Hon'ble Tribunal issue necessary directions to safeguard corporate governance and shareholder rights.`
    };
  }

  // Default fallback if no specific keywords match
  return {
    title: "Suit for Civil Dispute Resolution and Legal Enforcement",
    category: "General Civil Law",
    legalType: "Civil Law",
    sections: ["Code of Civil Procedure, 1908", "Indian Contract Act, 1872"],
    court: "District Civil Court / Appropriate Jurisdiction",
    draft: `The Complainant seeks formal legal intervention for resolution of the dispute and enforcement of lawful rights. It is prayed that the Hon'ble Court issue notice to the opposite party and pass orders as deemed fit and proper in the interest of equity and justice.`
  };
}

/* AI Analysis: Generate Title & Category from Description */
router.post("/analyze-story", auth(), async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.length < 10) {
      return res.status(400).json({ message: "Description too short to analyze." });
    }

    // COURTROOM-READY LEGAL TRIAGE (Groq Llama 3.3 with Detailed Taxonomy)
    const GROQ_KEY = process.env.GROQ_API_KEY;
    
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

    const analysisPrompt = `You are a Senior Indian Legal Expert specializing in court case classification. Analyze the story and return ONLY a JSON object.

    CRITICAL CLASSIFICATION RULE:
    - If the story involves assault, bodily hurt, threats, criminal intimidation, abusive language, murder, rape, robbery, theft, kidnapping, cheating, fraud, police FIR, Bharatiya Nyaya Sanhita (BNS), or Indian Penal Code (IPC) offences — legalType MUST be "Criminal Law".
    - If the story involves property, personal loans, or civil money recovery (non-corporate) — legalType is "Civil Law".
    - If the story involves defective products, deficient service, warranty, or consumer disputes — legalType is "Consumer Protection".
    - If the story involves divorce, custody, dowry, alimony, marriage — legalType is "Family Law".
    - If the story involves unpaid salary, job termination, PF — legalType is "Labor Law".
    - If the story involves hacking, online fraud, UPI fraud, cybercrime — legalType is "Cyber Law".
    - If the story involves GST, income tax, customs, tds — legalType is "Tax Law".
    - If the story involves company insolvency, SEBI, shareholder, corporate, Share Purchase Agreement (SPA), equity, investment, startup, or business contracts — legalType is "Corporate Law".

    ALLOWED legalType VALUES (use EXACTLY one of these):
    "Criminal Law" | "Civil Law" | "Family Law" | "Labor Law" | "Consumer Protection" | "Cyber Law" | "Tax Law" | "Corporate Law"

    COURTROOM-READY TITLE MAPPING (pick closest match):
    ${JSON.stringify(TAXONOMY_TITLES, null, 2)}

    YOUR GOAL:
    1. "title": Formal legal petition title matching the story — use taxonomy if possible, else create a precise formal title.
    2. "category": Short high-level matter (e.g., "Assault & Bodily Injury").
    3. "legalType": MUST be one of the ALLOWED values listed above.
    4. "sections": Array of 2-4 specific Indian law sections applicable (e.g., ["Sec 115(2) BNS", "Sec 351(2) BNS"]).
    5. "court": Exact Indian court jurisdiction (e.g., "Judicial Magistrate First Class (JMFC)", "Family Court").
    6. "draft": 2-sentence formal legal petition draft in third person.

    STORY: ${description}

    RESPOND WITH ONLY THIS JSON (no explanation, no markdown):
    {"title": "...", "category": "...", "legalType": "...", "sections": ["..."], "court": "...", "draft": "..."}`;

    try {
      // PRIMARY: Groq (llama-3.3-70b-versatile) — fastest + most accurate for Indian legal JSON
      if (GROQ_KEY) {
        console.log("[AI TRIAGE] Attempting Groq (llama-3.3-70b-versatile) Analysis...");
        try {
          const groqRes = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: "You are a Senior Indian Legal Expert. You ALWAYS respond with valid JSON only. No markdown, no explanations." },
                { role: "user", content: analysisPrompt }
              ],
              response_format: { type: "json_object" },
              temperature: 0.1,
              max_tokens: 800
            },
            { headers: { Authorization: `Bearer ${GROQ_KEY}` }, timeout: 12000 }
          );
          let rawContent = groqRes.data.choices[0].message.content;
          rawContent = rawContent.replace(/```json|```/g, "").trim();
          const data = JSON.parse(rawContent);
          console.log("[AI TRIAGE] Groq Success:", data.title, "|", data.legalType);
          return res.json({
            title: data.title,
            category: data.category,
            legalType: data.legalType,
            sections: data.sections || [],
            court: data.court || "",
            draft: data.draft || ""
          });
        } catch (err) {
          console.error("[AI TRIAGE] Groq Failed:", err.response?.data || err.message);
        }
      }

      throw new Error("Groq triage failed — using smart heuristic engine.");

    } catch (aiErr) {
      console.warn("[AI TRIAGE] Using smart heuristic triage engine due to AI fallback.");
      const heuristicData = smartHeuristicTriage(description);
      res.json(heuristicData);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PRE-FILING MEDIATION CHECK */
router.post("/check-mediation", auth(), async (req, res) => {
  try {
    const { title, description, category, legalType } = req.body;
    const typeStr = (legalType || category || "").toLowerCase();
    const descStr = (description || "").toLowerCase();
    const combinedStr = `${typeStr} ${descStr}`;

    // 1. Strict Exclusions: Criminal, Police, Non-compoundable, Constitutional, and Administrative Offences
    const MED_EXCLUSIONS = [
      "murder", "attempt to murder", "rape", "gang rape", "terrorism",
      "human trafficking", "kidnapping", "armed robbery", "dacoity",
      "serious assault", "assault", "assaulted", "wooden stick", "weapon",
      "acid attack", "waging war", "narcotics", "ndps", "counterfeit currency",
      "voluntarily causing hurt", "bodily harm", "injury", "injuries", "hurt",
      "criminal intimidation", "intentional insult", "obscene language",
      "police station", "police complaint", "complaint was lodged", "accused", "complainant",
      "bns", "bharatiya nyaya sanhita", "ipc", "crpc", "bnss", "crime", "criminal",
      "illegal custody", "police custody", "judicial custody", "remand", "fir", "arrest", "bail", "non-bailable",
      "election petition", "writ petition", "habeas corpus", "mandamus", "quo warranto",
      "professional misconduct", "bar council", "declaration of title against government"
    ];

    for (const excl of MED_EXCLUSIONS) {
      if (combinedStr.includes(excl)) {
        console.log(`[Mediation Excluded] Found exclusion term: ${excl}`);
        return res.json({ 
          eligible: false, 
          reason: `Case involves criminal / public law offence (${excl}). Court litigation or police prosecution required.` 
        });
      }
    }

    // 2. Try calling Python AI Mediation Microservice for exact trained script and classification
    try {
      const aiRes = await axios.post(
        getAIMediationURL(),
        {
          caseTitle: title || "Legal Consultation",
          caseType: legalType || category || "",
          citizenName: req.user?.name || "User",
          lang: req.body.lang || "en",
          userInput: description || ""
        },
        { timeout: 15000 }
      );
      if (aiRes.data && aiRes.data.eligible !== undefined) {
        if (!aiRes.data.eligible) {
          return res.json({ eligible: false, classification: aiRes.data.classification });
        }
        return res.json({
          eligible: true,
          actName: aiRes.data.mediationAct?.actName || "The Mediation Act, 2023 (Section 4)",
          timeline: "30 to 90 Days (Pre-litigation consensual settlement)",
          keyBenefit: aiRes.data.mediationAct?.keyBenefit || "Faster, private, and mutually acceptable resolution without lengthy court trial",
          script: aiRes.data.script || `Hello. I am your JurisVault neural legal advisor. Based on your statement, your case qualifies for pre-litigation consensual mediation under Section 4 of The Mediation Act, 2023. A certified neutral mediator will conduct confidential sessions to arrive at a fair, mutually acceptable resolution in 30 to 90 days without going through a lengthy court trial. This Mediated Settlement Agreement has the same legally binding force as a court decree.`,
          videoUrl: aiRes.data.videoUrl || "https://assets.mixkit.co/videos/preview/mixkit-legal-gavel-striking-on-a-block-41898-large.mp4",
          classification: aiRes.data.classification
        });
      }
    } catch (aiErr) {
      console.warn("AI Mediation microservice check failed, falling back to local taxonomy:", aiErr.message);
    }

    const MED_ELIGIBLE_KEYWORDS = [
      "divorce", "custody", "visitation", "alimony", "maintenance", "matrimonial", "family",
      "property", "boundary", "easement", "landlord", "tenant", "rent", "lease", "builder", "possession",
      "commercial", "vendor", "supply", "franchise", "distribution", "agency", "joint venture", "business",
      "shareholder", "director", "dissolution", "share transfer", "corporate",
      "salary", "settlement", "employment", "termination", "workplace", "labour", "wages", "gratuity",
      "refund", "defective", "deficient", "warranty", "e-commerce", "consumer",
      "loan", "emi", "banking", "cheque", "138", "money recovery", "dues", "breach of contract", "partnership",
      "insurance", "policy", "claim", "accident", "mact",
      "licensing", "royalty", "ip assignment", "trademark", "copyright", "patent",
      "software", "saas", "it service", "marketplace", "online service",
      "fee refund", "admission", "hospital billing", "medical billing", "school",
      "noise", "shared access", "water usage", "resident welfare", "rwa", "society", "neighbour", "co-operative",
      "mediation", "settle", "settlement", "partner", "partition", "garment", "dispute", "friend", "inheritance", "inherited", "agreement", "divide", "division", "mutual", "civil", "share", "investment", "profit", "expense", "sibling"
    ];
    const isEligibleCategory = [
      "civil law", "family law", "labor law", "consumer protection", "commercial law", "corporate law",
      "property & real estate", "matrimonial & family disputes", "employment & labor rights",
      "general civil law", "consumer protection", "financial fraud & cheating", "civil", "family", "commercial", "property", "labor", "corporate"
    ].some(cat => typeStr.includes(cat));

    const isEligible = isEligibleCategory || MED_ELIGIBLE_KEYWORDS.some(kw => combinedStr.includes(kw)) || combinedStr.includes("mediation") || combinedStr.includes("settle") || combinedStr.includes("dispute") || combinedStr.includes("partner") || combinedStr.includes("partition");

    if (!isEligible) {
      return res.json({ eligible: false });
    }

    let topicName = "your civil or commercial dispute";
    if (typeStr.includes("labor") || typeStr.includes("job") || typeStr.includes("employ") || descStr.includes("salary release") || descStr.includes("notice period") || descStr.includes("wrongful termination") || descStr.includes("gratuity") || descStr.includes("provident fund")) {
      topicName = "your employment, salary release, and notice period dispute";
    } else if (typeStr.includes("family") || typeStr.includes("matrimonial") || descStr.includes("child custody") || descStr.includes("alimony") || descStr.includes("mutual divorce") || descStr.includes("matrimonial")) {
      topicName = "your matrimonial, separation, or family dispute";
    } else if (typeStr.includes("property") || typeStr.includes("tenant") || descStr.includes("rent dispute") || descStr.includes("boundary dispute") || descStr.includes("property partition") || descStr.includes("lease agreement") || descStr.includes("builder buyer")) {
      topicName = "your property, rental, or tenancy dispute";
    } else if (typeStr.includes("consumer") || descStr.includes("defective product") || descStr.includes("deficient service") || descStr.includes("warranty claim") || descStr.includes("refund dispute")) {
      topicName = "your consumer protection and service grievance";
    } else if (typeStr.includes("commercial") || typeStr.includes("corporate") || descStr.includes("vendor agreement") || descStr.includes("shareholder") || descStr.includes("joint venture") || descStr.includes("commercial contract")) {
      topicName = "your commercial contract and business dispute";
    }

    res.json({
      eligible: true,
      actName: "The Mediation Act, 2023 (Section 4)",
      timeline: "30 to 90 Days (Pre-litigation consensual settlement)",
      keyBenefit: "Faster, private, and mutually acceptable resolution without lengthy court trial",
      script: `Hello. I am your JurisVault neural legal advisor. Based on your statement regarding ${topicName}, your case qualifies for pre-litigation consensual mediation under Section 4 of The Mediation Act, 2023. A certified neutral mediator will conduct confidential sessions to arrive at a fair, mutually acceptable resolution in 30 to 90 days without going through a lengthy court trial. This Mediated Settlement Agreement has the same legally binding force as a court decree.`,
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-legal-gavel-striking-on-a-block-41898-large.mp4"
    });
  } catch (err) {
    res.status(500).json({ eligible: false, message: err.message });
  }
});

/* CONNECT: Client requests a lawyer */
router.post("/connect/:caseId/:lawyerId", auth(), async (req, res) => {
  try {
    const { caseId, lawyerId } = req.params;
    const caseToConnect = await Case.findById(caseId);
    const isMediation = caseToConnect.status.includes("Mediation");
    const newStatus = isMediation ? "Pending Mediation Acceptance" : "Pending Expert Acceptance";

    // Set status to pending acceptance - Lawyer is NOT officially assigned yet
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      { 
        assignedLawyer: lawyerId,
        status: newStatus,
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
      status: { $in: ["Pending Expert Acceptance", "Pending Mediation Acceptance", "Requested"] } 
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
    const activeStatuses = ["In Progress", "Hearing Scheduled", "Verdict Pending", "Mediation in Progress", "Mediation Session Scheduled", "Mutual Settlement Reached"];
    
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
    
    const caseToAccept = await Case.findById(caseId);
    const isMediation = caseToAccept.status.includes("Mediation");
    const newStatus = isMediation ? "Mediation in Progress" : "In Progress";
    
    // Officially set status to 'In Progress' and confirm the lawyer
    const acceptedCase = await Case.findByIdAndUpdate(
      caseId,
      { 
        status: newStatus,
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

    // 📧 EMAIL: Send AI alert for case acceptance
    const citizen = await User.findById(acceptedCase.user?._id);
    if (citizen && citizen.email) {
       sendAIWhatsApp(citizen.email, citizen.name, acceptedCase.title, "booking_accepted", citizen.preferredLanguage || "en");
    }

    console.log(`Case Accepted: ${caseId} by Lawyer ${req.user.id}`);
    res.json({ message: "Case Accepted Successfully", case: acceptedCase });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get(
  "/mediation-video/status/:videoId",
  auth(),
  async (req, res) => {
    try {
      const response = await axios.get(
        getAIMediationStatusURL(req.params.videoId),
        { timeout: 10000 }
      )
      res.json(response.data)
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

router.get(
  "/matched-lawyers/:caseId",
  auth(),
  async (req, res) => {
    try {
      const targetCase =
        await Case.findById(req.params.caseId)
      if (!targetCase) {
        return res.status(404).json({
          message: "Case not found"
        })
      }
      const lawyerTiers =
        mapIncomeToLawyerTier(
          targetCase.clientIncomeTier || "mid"
        )
      const lawyers = await Lawyer.find({
        isVerified: true,
        isBlocked:  false,
        tier: { $in: lawyerTiers },
        specialization: {
          $regex: targetCase.legalType ||
            targetCase.type || "",
          $options: "i"
        }
      })
      .sort({ rating: -1, casesClaimedCount: 1 })
      .limit(10)
      .select("name specialization rating " +
        "experience tier minFeePerCase " +
        "maxFeePerCase courtLevels city " +
        "state photo")

      res.json({
        lawyers,
        matchingInfo: {
          complexity:  targetCase.complexity,
          courtLevel:  targetCase.courtLevel,
          incomeTier:
            targetCase.clientIncomeTier,
          feeRange:
            targetCase.estimatedFeeRange
        }
      })
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

router.smartHeuristicTriage = smartHeuristicTriage;
/* Update Case Status */
router.put("/:id/status", auth(), async (req, res) => {
  try {
    const updated = await Case.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
