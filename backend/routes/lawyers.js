const router = require("express").Router();
const Lawyer = require("../models/Lawyer"); // 👈 Pointing to the NEW collection

// Get All Lawyers from the 'lawyers' collection
router.get("/", async (req, res) => {
  try {
    const lawyers = await Lawyer.find({ 
      isVerified: true 
    });
    
    console.log(`🔍 Expert Marketplace: Found ${lawyers.length} advocates in the 'lawyers' collection.`);
    res.json(lawyers);

  } catch (err) {
    console.error("Lawyer Fetch Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
