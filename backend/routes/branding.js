const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");

// 📂 STORAGE CONFIG FOR BRANDING
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const brandingPath = path.join(__dirname, "../public/branding");
    if (!fs.existsSync(brandingPath)) fs.mkdirSync(brandingPath, { recursive: true });
    cb(null, brandingPath);
  },
  filename: (req, file, cb) => {
    // We always name it logo.png so it overwrites the old one globally
    cb(null, "logo.png");
  }
});

const upload = multer({ storage });

// 📤 UPLOAD GLOBAL LOGO
router.post("/upload-logo", auth(["admin"]), upload.single("logo"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No logo file provided" });
    
    // We can also copy it to the other public folders if they are local
    // but serving it from the backend is more robust.
    res.json({ 
      message: "✅ Platform logo updated globally!",
      url: "/branding/logo.png" 
    });
  } catch (err) {
    res.status(500).json({ message: "Logo update failed" });
  }
});

module.exports = router;
