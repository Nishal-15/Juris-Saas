const User = require("../models/User");
const Lawyer = require("../models/Lawyer"); // 👈 Added
const Case = require("../models/Case");
const bcrypt = require("bcryptjs");
const router = require("express").Router();
const multer = require("multer");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");

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

module.exports = router;