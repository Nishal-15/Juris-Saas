const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const auth = require("../middleware/auth");

// 📁 Multer Config for Citizen Vault
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/documents");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

/* GET: Fetch user's vault */
router.get("/", auth(), async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* POST: Upload to vault */
router.post("/upload", auth(), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const ext = path.extname(req.file.originalname).toUpperCase().replace(".", "");
    const type = ["PDF", "PNG", "JPG", "JPEG"].includes(ext) ? (ext === "PDF" ? "PDF" : "IMG") : "DOC";

    const newDoc = new Document({
      user: req.user.id,
      name: req.file.originalname,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      type: type,
      size: (req.file.size / 1024).toFixed(1) + " KB"
    });

    await newDoc.save();
    res.json({ message: "Document safely stored in vault!", document: newDoc });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
