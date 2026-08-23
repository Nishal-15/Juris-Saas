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
const { sendOtpEmail } = require("../utils/notifier");
const { sendEmail, citizenWelcomeTemplate, lawyerWelcomeTemplate, passwordResetTemplate } = require("../utils/mailer");

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
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, and PDF allowed."), false);
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

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

/* Email format */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return res.status(400).json({
    message: "Invalid email format."
  })
}

/* Password strength */
if (password.length < 8) {
  return res.status(400).json({
    message:
      "Password must be at least " +
      "8 characters long."
  })
}

/* Phone format — handles +91 prefix */
if (phone) {
  let normalizedPhone = phone.replace(/[\s\-\+]/g, "");
  if (normalizedPhone.startsWith("91") && normalizedPhone.length === 12) {
    normalizedPhone = normalizedPhone.slice(2);
  }
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(normalizedPhone)) {
    return res.status(400).json({
      message: "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)."
    });
  }
}

/* Name length */
if (name.trim().length < 2) {
  return res.status(400).json({
    message: "Name must be at least " +
      "2 characters."
  })
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
      subscriptionTier: "Trial",
      subscriptionExpiresAt: new Date(+new Date() + 14 * 24 * 60 * 60 * 1000)
    });

    // 🤖 START BACKGROUND AI VERIFICATION
    verifyLawyerCredentials(lawyer._id, lawyer.certificateUrl);

    // 📧 SEND WELCOME EMAIL TO LAWYER
    sendEmail({
      to: lawyer.email,
      ...lawyerWelcomeTemplate(lawyer.name)
    }).catch(e => console.error("Lawyer welcome email error:", e));

    const token = jwt.sign({ id: lawyer._id, role: "lawyer" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    
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

/* Email format */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return res.status(400).json({
    message: "Invalid email format."
  })
}

/* Password strength */
if (password.length < 8) {
  return res.status(400).json({
    message:
      "Password must be at least " +
      "8 characters long."
  })
}

/* Phone format */
const phoneRegex = /^[6-9]\d{9}$/
if (phone && !phoneRegex.test(
  phone.replace(/[\s\-\+]/g, "")
)) {
  return res.status(400).json({
    message:
      "Enter a valid 10-digit " +
      "Indian mobile number."
  })
}

/* Name length */
if (name.trim().length < 2) {
  return res.status(400).json({
    message: "Name must be at least " +
      "2 characters."
  })
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

    // 📧 SEND WELCOME EMAIL TO CITIZEN
    sendEmail({
      to: user.email,
      ...citizenWelcomeTemplate(user.name)
    }).catch(e => console.error("Citizen welcome email error:", e));

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

    // 🛡️ HYBRID MODEL SELECTION
    let user = null;

    if (role === "lawyer") {
      user = await Lawyer.findOne({ email: normalizedEmail });
    } else if (role === "user" || role === "admin") {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      // Role not provided (unified login) - search both
      user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        user = await Lawyer.findOne({ email: normalizedEmail });
      }
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 🔒 2FA OTP LOGIC FOR ADMIN
    if (user.role === "admin") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
      user.twoFactorOtp = otp;
      user.twoFactorExpires = Date.now() + 10 * 60 * 1000; // 10 mins
      await user.save();
      
      await sendOtpEmail(user.email, otp);
      
      // Always log OTP in server logs for easy access on hosted Render dashboard
      console.log(
        `[2FA] OTP generated for ${user.email}`
      );
      return res.json({ requireOtp: true, email: user.email, message: "OTP sent to email" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

const refreshToken = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET + "_refresh",
  { expiresIn: "30d" }
)

/* Save refresh token to DB */
user.refreshToken = refreshToken
await user.save()

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;
    delete userResponse.twoFactorOtp;
    delete userResponse.twoFactorExpires;

    // 🔄 Ensure verificationStatus is in sync with isVerified for lawyers
    if (userResponse.role === "lawyer" && userResponse.isVerified && userResponse.verificationStatus !== "verified") {
      userResponse.verificationStatus = "verified";
      // Also persist the fix to DB silently
      Lawyer.findByIdAndUpdate(user._id, { verificationStatus: "verified" }).exec();
    }

    res.json({
  token,
  refreshToken,
  user: userResponse
});

  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===========================
VERIFY ADMIN OTP
=========================== */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const isValidOtp = (user.twoFactorOtp && user.twoFactorOtp === otp && Date.now() <= user.twoFactorExpires);
    if (!isValidOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP
    user.twoFactorOtp = null;
    user.twoFactorExpires = null;
    await user.save();

    console.log(`✅ [2FA] Admin ${user.email} verified successfully.`);
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

const refreshToken = jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET + "_refresh",
  { expiresIn: "30d" }
)

/* Save refresh token to DB */
user.refreshToken = refreshToken
await user.save()

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
  token,
  refreshToken,
  user: userResponse
});
  } catch (err) {
    console.error("❌ OTP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* GET USER INFO */
router.get("/user/:id", auth(), async (req, res) => {
  try {
    const HIDDEN = "-password -refreshToken -twoFactorOtp -twoFactorExpires";
    let user = await User.findById(req.params.id).select(HIDDEN);
    if (!user) {
      user = await Lawyer.findById(req.params.id).select(HIDDEN);
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

    let user;
    if (req.user.role === "lawyer") {
      user = await Lawyer.findByIdAndUpdate(req.user.id, updates, { new: true });
    } else {
      user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

const axios = require("axios");
const OtpModel = require("../models/Otp");

// 📲 1. REQUEST OTP (MongoDB-backed — survives server restarts)
router.post("/request-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required for OTP" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const normalizedEmail = email.toLowerCase().trim();

    /* Upsert: replace any existing OTP for this email */
    await OtpModel.findOneAndUpdate(
      { email: normalizedEmail },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    try {
      const { sendEmail, otpTemplate } = require("../utils/mailer");
      const { subject, html } = otpTemplate(otp, normalizedEmail);
      await sendEmail({ to: normalizedEmail, subject, html });
    } catch (mailErr) {
      console.error("❌ [OTP] Email failed:", mailErr.message);
      return res.status(500).json({ message: "Failed to send verification email. Please check email address." });
    }

    res.json({ message: "Verification code sent to your email address." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📲 2. VERIFY OTP
router.post("/verify-email-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const normalizedEmail = email.toLowerCase().trim();
    const record = await OtpModel.findOne({ email: normalizedEmail });

    if (!record) return res.status(400).json({ message: "OTP expired or invalid" });
    if (record.otp !== otp) return res.status(400).json({ message: "Incorrect or expired OTP" });

    /* Delete on successful verification */
    await OtpModel.deleteOne({ email: normalizedEmail });

    res.json({ message: "Email verified successfully!", verified: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/refresh-token",
  async (req, res) => {
    try {
      const { refreshToken } = req.body
      if (!refreshToken) {
        return res.status(401).json({
          message: "Refresh token required"
        })
      }

      /* Verify the refresh token */
      let decoded
      try {
        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET ||
            process.env.JWT_SECRET + "_refresh"
        )
      } catch {
        return res.status(401).json({
          message: "Invalid or expired " +
            "refresh token. Please login again."
        })
      }

      /* Find user in correct collection */
      let user = null
      if (decoded.role === "lawyer") {
        user = await Lawyer.findOne({
          _id:          decoded.id,
          refreshToken: refreshToken
        })
      } else {
        user = await User.findOne({
          _id:          decoded.id,
          refreshToken: refreshToken
        })
      }

      if (!user) {
        return res.status(401).json({
          message: "Refresh token not " +
            "recognized. Please login again."
        })
      }

      /* Issue new access token */
      const newToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      )

      /* Rotate refresh token */
      const newRefresh = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_REFRESH_SECRET ||
          process.env.JWT_SECRET + "_refresh",
        { expiresIn: "30d" }
      )
      user.refreshToken = newRefresh
      await user.save()

      res.json({
        token:        newToken,
        refreshToken: newRefresh
      })
    } catch (err) {
      res.status(500).json({
        message: err.message
      })
    }
  }
)

/* FORGOT PASSWORD */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: "Please enter your email address." });
    
    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });
    let isLawyer = false;
    
    if (!user) {
      user = await Lawyer.findOne({ email: normalizedEmail });
      isLawyer = true;
    }
    
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }
    
    const resetToken = jwt.sign(
      { id: user._id, role: isLawyer ? "lawyer" : "user", type: "reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    
    const origin = req.headers.origin || "https://jurisbot.in";
    const resetLink = `${origin}/reset-password/${resetToken}`;
    
    sendEmail({
      to: user.email,
      ...passwordResetTemplate(resetLink, user.name)
    }).catch(e => console.error("Password reset email error:", e));
    
    res.json({ message: "Password reset instructions have been sent to your email address!" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: "Failed to send reset email. Please try again." });
  }
});

/* RESET PASSWORD */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Invalid request data." });
    if (newPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters long." });
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Reset link has expired or is invalid. Please request a new one." });
    }
    
    if (decoded.type !== "reset") {
      return res.status(400).json({ message: "Invalid token type." });
    }
    
    let user = await User.findById(decoded.id);
    if (!user) {
      user = await Lawyer.findById(decoded.id);
    }
    
    if (!user) return res.status(404).json({ message: "Account not found." });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ message: "Your password has been reset successfully! You can now log in." });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error while resetting password." });
  }
});

module.exports = router;
