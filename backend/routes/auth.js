const router = require("express").Router();
const User = require("../models/User");
const Lawyer = require("../models/Lawyer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyLawyerCredentials } = require("../utils/aiVerifier");

// 📁 UPLOAD CONFIG (Multi-field)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = "./uploads";
    if (file.fieldname === "certificate") dir = "./uploads/certificates";
    if (file.fieldname === "avatar") dir = "./uploads/avatars";
    
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const prefix = file.fieldname === "certificate" ? "BAR" : "PROF";
    cb(null, `${prefix}_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

/* ===========================
LAWYER REGISTER
=========================== */
router.post("/register-lawyer", upload.fields([
  { name: "certificate", maxCount: 1 },
  { name: "avatar", maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, email, password, phone, barId, experience, specialization } = req.body;

    if (!name || !email || !password || !phone || !barId) {
      return res.status(400).json({ message: "Mandatory fields missing." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // Check both collections
    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingLawyer = await Lawyer.findOne({ email: normalizedEmail });
    
    if (existingUser || existingLawyer) {
      return res.status(400).json({ message: "Account already exists with this email." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const certificateUrl = req.files["certificate"] ? req.files["certificate"][0].path : null;
    const avatarUrl = req.files["avatar"] ? req.files["avatar"][0].path : null;

    const lawyer = await Lawyer.create({
      name,
      email: normalizedEmail,
      password: hash,
      phone,
      role: "lawyer",
      barId,
      experience,
      specialization,
      certificateUrl,
      avatar: avatarUrl,
      verificationStatus: "pending",
      subscriptionTier: "trial",
      subscriptionExpiresAt: new Date(+new Date() + 30 * 24 * 60 * 60 * 1000)
    });

    // 🤖 START BACKGROUND AI VERIFICATION
    verifyLawyerCredentials(lawyer._id, lawyer.certificateUrl);

    const token = jwt.sign({ id: lawyer._id, role: "lawyer" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    
    const userResponse = lawyer.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse, message: "Registration successful! Verification is in progress." });
  } catch (err) {
    console.error("Lawyer Registration Error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
});


/* ===========================
REGISTER
=========================== */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role, preferredLanguage } = req.body;

    // ✅ VALIDATION
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // ✅ NORMALIZE EMAIL
    const normalizedEmail = email.toLowerCase().trim();

    // ✅ IRON WALL: CHECK BOTH COLLECTIONS
    const existingUser = await User.findOne({ email: normalizedEmail });
    const existingLawyer = await Lawyer.findOne({ email: normalizedEmail });
    
    if (existingUser || existingLawyer) {
      return res.status(400).json({ message: "An account already exists with this email address." });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hash,
      phone,
      role: role || "user",
      preferredLanguage: preferredLanguage || "en"
    });

    // ✅ GENERATE TOKEN DIRECTLY
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
LOGIN (HYBRID AUTH)
=========================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`Attempting login: ${normalizedEmail} as ${role || "user"}`);
    
    // 🛡️ DYNAMIC MODEL SELECTION
    const Model = (role === "lawyer") ? Lawyer : User;
    
    const user = await Model.findOne({ email: normalizedEmail });
    if (!user) {
      console.log(`❌ Account not found in ${role || "user"} collection: ${normalizedEmail}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔐 Password match: ${isMatch}`);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Generating JWT...");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("✅ JWT Generated");

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log("🚀 Sending success response...");
    res.json({ token, user: userResponse });

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET USER INFO */
router.get("/user/:id", async (req, res) => {
  try {
    let user = await User.findById(req.params.id).select("name role");
    if (!user) {
      user = await Lawyer.findById(req.params.id).select("name role");
    }
    
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* UPDATE PROFILE */
router.put("/update", auth(), async (req, res) => {
  try {
    const { name, phone, preferredLanguage } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (preferredLanguage) updates.preferredLanguage = preferredLanguage;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

const axios = require("axios");
const otpCache = {};

// 📲 1. REQUEST OTP
router.post("/request-otp", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number required" });

    // Generate numeric 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpCache[phone] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // 5 mins expiry

    // Normalize phone number for MSG91 (e.g. 917708084027)
    let cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone.startsWith("91") && cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    }

    console.log(`📱 [MSG91 OTP SERVICE] Dispatching code for ${phone}: ${otp}`);

    // Call real MSG91 SMS/OTP API
    try {
      const msg91AuthKey = "513203T6qGKIGXOCG69f4a117P1";
      const msg91Url = `https://control.msg91.com/api/v5/otp?mobile=${cleanPhone}&authkey=${msg91AuthKey}&otp=${otp}`;
      await axios.post(msg91Url);
      console.log(`✅ [MSG91 Success] OTP delivered via MSG91 to ${phone}`);
    } catch (msg91Err) {
      console.error("❌ [MSG91 API Error]", msg91Err.response?.data || msg91Err.message);
    }

    res.json({ message: "Verification code sent to your phone number via MSG91.", otp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📲 2. VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required" });

    const cached = otpCache[phone];
    if (!cached) return res.status(400).json({ message: "OTP expired or invalid" });

    if (cached.otp !== otp || Date.now() > cached.expires) {
      return res.status(400).json({ message: "Incorrect or expired OTP" });
    }

    // Success! Wipe from cache
    delete otpCache[phone];

    res.json({ message: "Phone number verified successfully!", verified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
