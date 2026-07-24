const User = require("../models/User");
const Lawyer = require("../models/Lawyer"); // 👈 Added
const Case = require("../models/Case");
const LawSync = require("../models/LawSync");
const bcrypt = require("bcryptjs");
const router = require("express").Router();
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");

// 📊 GET DASHBOARD STATS (OPTIMIZED)
router.get("/stats", auth(["admin"]), async (req, res) => {
  try {
    const citizensCount = await User.countDocuments({ role: "user" });
    const lawyersCount = await Lawyer.countDocuments({ isVerified: true });
    const pendingCount = await Lawyer.countDocuments({ verificationStatus: "pending" });
    
    let lawsCount = 0;
    const aiServicePath = path.join(__dirname, "../ai-service/laws");
    if (fs.existsSync(aiServicePath)) {
      lawsCount = fs.readdirSync(aiServicePath).filter(f => f.endsWith(".pdf")).length;
    }

    // 1. Generate Pie Chart Data (Cases grouped by legalType)
    const casesByCategory = await Case.aggregate([
      { $group: { _id: "$legalType", value: { $sum: 1 } } }
    ]);
    const pieData = casesByCategory.map(item => ({
      name: item._id || "Uncategorized",
      value: item.value
    }));

    // If pieData is empty, provide fallback
    const finalPieData = pieData.length > 0 ? pieData : [
      { name: "Civil Law", value: 1 }, { name: "Criminal Law", value: 1 }
    ];

    // 2. Generate Bar Chart Data (Cases created per day of the week)
    const casesByDay = await Case.aggregate([
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" }, // 1 = Sunday, 7 = Saturday
          queries: { $sum: 1 }
        }
      }
    ]);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Initialize standard week structure
    const barDataMap = {};
    dayNames.forEach(day => { barDataMap[day] = 0; });
    
    casesByDay.forEach(item => {
      // $dayOfWeek returns 1-7
      if (item._id) {
        barDataMap[dayNames[item._id - 1]] = item.queries;
      }
    });

    const barData = dayNames.map(name => ({
      name,
      queries: barDataMap[name],
      latency: Math.floor(Math.random() * (400 - 250 + 1) + 250) // Simulated slight real-time latency jitter
    }));

    res.json({
      citizens: citizensCount,
      lawyers: lawyersCount,
      pending: pendingCount,
      laws: lawsCount,
      pieData: finalPieData,
      barData: barData
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🏛️ GET PENDING LAWYERS
router.get("/pending-lawyers", auth(["admin"]), async (req, res) => {
  try {
    const pending = await Lawyer.find({ 
      verificationStatus: "pending" 
    }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 👥 GET ALL CITIZENS
router.get("/citizens", auth(["admin"]), async (req, res) => {
  try {
    const citizens = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.json(citizens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 👨‍⚖️ GET ALL VERIFIED LAWYERS (WITH CASE COUNTS)
router.get("/lawyers", auth(["admin"]), async (req, res) => {
  try {
    const lawyers = await Lawyer.find({ isVerified: true }).sort({ createdAt: -1 });
    
    // Manually count cases for each lawyer to ensure absolute accuracy
    const lawyersWithStats = await Promise.all(lawyers.map(async (l) => {
      const caseCount = await Case.countDocuments({ assignedLawyer: l._id });
      return {
        _id: l._id,
        name: l.name,
        email: l.email,
        specialization: l.specialization,
        experience: l.experience,
        rating: l.rating,
        caseCount
      };
    }));

    res.json(lawyersWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ VERIFY/REJECT LAWYER
router.patch("/verify-lawyer/:id", auth(["admin"]), async (req, res) => {
  try {
    const { status } = req.body; // "verified" or "rejected"
    const lawyer = await Lawyer.findById(req.params.id);
    if (!lawyer) return res.status(404).json({ message: "Lawyer not found" });

    lawyer.verificationStatus = status;
    lawyer.isVerified = (status === "verified");
    await lawyer.save();

    res.json({ message: `Lawyer account ${status} successfully.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📁 File upload config (SANITTIZED)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../ai-service/laws");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 🛡️ SANITIZE: Prevent spaces or shell-escaping issues
    const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
    cb(null, `${Date.now()}_${safeName}`);
  }
});
const upload = multer({ storage });

// ✅ Upload Law (ASYNC INDEXING CONTEXT)
router.post("/upload-law", auth(["admin"]), upload.single("pdf"), (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      // 1. Instant response for UX
      res.json({ message: "✅ File saved! JurisBot is updating its Legal Knowledge Base in the background. This will take a few seconds." });

      // 2. Resilient Background Ingestion (USING spawn for better safety)
      const { spawn } = require("child_process");
      const aiServicePath = path.join(__dirname, "../ai-service");
      
      const cmd = process.platform === 'win32' ? 'python' : 'python3';
      console.log(`🤖 AI SYNC: Starting indexing with [${cmd}]...`);

      const pythonProcess = spawn(cmd, ["ingest.py"], { cwd: aiServicePath });

      pythonProcess.stdout.on('data', (data) => console.log(`🎯 AI SYNC: ${data}`));
      pythonProcess.stderr.on('data', (data) => console.warn(`⚠ AI SYNC WARNING: ${data}`));
      pythonProcess.on('close', (code) => {
        console.log(`🎯 AI SYNC Process exited with code ${code}`);
      });

    } catch (error) {
      console.error("❌ UPLOAD PROCESS CRASHED:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
});

// 🛡️ SEEDING ROUTE (DISABLED FOR PRODUCTION)
router.post("/seed-lawyers", auth(["admin"]), async (req, res) => {
  res.status(403).json({ message: "Seeding is disabled in production mode to maintain data integrity." });
});

// 👩‍⚖️ ADD INDIVIDUAL LAWYER
router.post("/add-lawyer", auth(["admin"]), async (req, res) => {
  res.status(403).json({ message: "Please use the public registration page for new experts." });
});

// 📚 GET INDEXED LAWS
router.get("/laws", auth(["admin"]), async (req, res) => {
  try {
    const aiServicePath = path.join(__dirname, "../ai-service/laws");
    if (!fs.existsSync(aiServicePath)) return res.json([]);
    const files = fs.readdirSync(aiServicePath).filter(f => f.endsWith(".pdf"));
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📂 GET ALL CASES (GLOBAL OVERSIGHT)
router.get("/all-cases", auth(["admin"]), async (req, res) => {
  try {
    const cases = await Case.find()
      .populate("user", "name email")
      .populate("assignedLawyer", "name email")
      .sort({ createdAt: -1 });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📢 BROADCAST SIGNAL (TO ALL OR TARGETED)
router.post("/broadcast", auth(["admin"]), async (req, res) => {
  try {
    const { target, title, message, priority } = req.body;
    const io = req.app.get("io");

    // 1. DATABASE PERSISTENCE (Optional: store in a Broadcasts collection)
    // 2. REAL-TIME SIGNAL
    if (target === "all") {
      io.emit("institutional-broadcast", { title, message, priority });
    } else {
      // Logic for specific roles if needed
      io.emit(`institutional-broadcast-${target}`, { title, message, priority });
    }

    console.log(`📡 BROADCAST: [${priority}] ${title} sent to ${target}`);
    res.json({ message: "Signal transmitted successfully across the grid." });
  } catch (err) {
    res.status(500).json({ message: "Signal transmission failed." });
  }
});
/* TRIGGER LAW AUTO-SYNC */
router.post(
  "/trigger-law-sync",
  auth(["admin"]),
  async (req, res) => {
    try {
      const { spawn } = require("child_process")
      const path      = require("path")
      const syncRecord = await LawSync.create({
        source:      req.body.source ||
                     "IndianKanoon",
        status:      "partial",
        triggeredBy: "admin",
        documentTitle:"Admin manual sync"
      })
      const scriptPath = path.join(
        __dirname,
        "../ai-service/auto_fetch.py"
      )
      const py = spawn("python", [
        scriptPath,
        "--source",
        req.body.source || "all",
        "--sync-id",
        syncRecord._id.toString()
      ])
      py.stdout.on("data", d =>
        console.log("[LawSync]", d.toString())
      )
      py.stderr.on("data", d =>
        console.error(
          "[LawSync Error]", d.toString()
        )
      )
      res.json({
        message: "Law sync triggered.",
        syncId:  syncRecord._id,
        status:  "running"
      })
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

/* GET LAW SYNC STATUS */
router.get(
  "/law-sync-status",
  auth(["admin"]),
  async (req, res) => {
    try {
      const history = await LawSync
        .find()
        .sort({ createdAt: -1 })
        .limit(20)
      const lastSuccess = await LawSync
        .findOne({ status: "success" })
        .sort({ createdAt: -1 })
      const totals = await LawSync.aggregate([{
        $group: {
          _id:   null,
          sects: { $sum: "$sectionsAdded" },
          docs:  { $sum: "$documentsAdded" }
        }
      }])
      res.json({
        lastSync:
          lastSuccess?.createdAt || null,
        lastStatus:
          lastSuccess?.status || "never",
        totalSections:
          totals[0]?.sects || 0,
        totalDocuments:
          totals[0]?.docs  || 0,
        history
      })
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

/* GET TIER ANALYTICS */
router.get(
  "/tier-analytics",
  auth(["admin"]),
  async (req, res) => {
    try {
      const [
        t1,t2,t3,
        low,mid,high,
        dist,hc,sc,
        lc,mc,hx
      ] = await Promise.all([
        Lawyer.countDocuments({tier:"tier1"}),
        Lawyer.countDocuments({tier:"tier2"}),
        Lawyer.countDocuments({tier:"tier3"}),
        User.countDocuments({
          role:"user",incomeTier:"low"
        }),
        User.countDocuments({
          role:"user",incomeTier:"mid"
        }),
        User.countDocuments({
          role:"user",incomeTier:"high"
        }),
        Case.countDocuments({
          courtLevel:"District Court"
        }),
        Case.countDocuments({
          courtLevel:"High Court"
        }),
        Case.countDocuments({
          courtLevel:"Supreme Court"
        }),
        Case.countDocuments({
          complexity:"Low"
        }),
        Case.countDocuments({
          complexity:"Mid"
        }),
        Case.countDocuments({
          complexity:"High"
        })
      ])
      res.json({
        lawyers:    {tier1:t1,tier2:t2,tier3:t3},
        citizens:   {low,mid,high},
        courts:     {
          district:dist,
          high:hc,
          supreme:sc
        },
        complexity: {low:lc,mid:mc,high:hx}
      })
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

/* BLOCK / UNBLOCK LAWYER */
router.patch(
  "/block-lawyer/:id",
  auth(
  ["admin"]),
  async (req, res) => {
    try {
      const { isBlocked } = req.body
      const lawyer =
        await Lawyer.findByIdAndUpdate(
          req.params.id,
          { isBlocked: !!isBlocked },
          { new: true }
        ).select("-password")
      if (!lawyer) {
        return res.status(404).json({
          message: "Lawyer not found"
        })
      }
      res.json({
        message: `Lawyer ${isBlocked ?
          "blocked" : "unblocked"} successfully`,
        lawyer
      })
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

/* CLEANUP ROUTE */
router.post(
  "/cleanup",
  auth(["admin"]),
  async (req, res) => {
    try {
      const result = await User.updateMany(
        {},
        {
          $unset: {
            barCouncilId:      "",
            subscriptionTier:  "",
            caseLimit:         "",
            casesClaimedCount: ""
          }
        }
      )
      res.json({
        message:
          `Cleanup complete. ` +
          `${result.modifiedCount} ` +
          `documents updated.`,
        modifiedCount: result.modifiedCount
      })
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

/* CASE FEEDBACK */
router.post(
  "/cases/:id/feedback",
  auth(),
  async (req, res) => {
    try {
      const { rating, comment } = req.body
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          message: "Rating must be 1 to 5"
        })
      }
      const targetCase =
        await Case.findById(req.params.id)
          .populate("assignedLawyer")
      if (!targetCase) {
        return res.status(404).json({
          message: "Case not found"
        })
      }
      if (targetCase.user.toString() !==
          req.user.id) {
        return res.status(403).json({
          message: "Only the case owner " +
            "can submit feedback"
        })
      }
      const lawyer = await Lawyer.findById(
        targetCase.assignedLawyer
      )
      if (lawyer) {
        const totalCases =
          lawyer.casesClaimedCount || 1
        const current =
          lawyer.rating || 4.5
        const newRating = parseFloat(
          (
            (current * (totalCases - 1) +
              rating) / totalCases
          ).toFixed(2)
        )
        await Lawyer.findByIdAndUpdate(
          lawyer._id,
          { rating: newRating }
        )
      }
      res.json({
        message: "Feedback submitted.",
        newRating: lawyer?.rating
      })
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

module.exports = router;