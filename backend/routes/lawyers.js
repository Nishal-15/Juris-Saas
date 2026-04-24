const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get All Lawyers (With Safe Sync)
router.get("/", async (req, res) => {
  try {
    // 🔍 Fetch only VERIFIED experts
    const lawyers = await User.find({ 
      role: "lawyer", 
      isVerified: true 
    }).select("name email role specialization experience fees rating avatar reviews");
    
    console.log(`🔍 Advocate Fetch: Found ${lawyers.length} verified experts.`);


    res.json(lawyers);

  } catch (err) {
    console.error("Lawyer Fetch Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
