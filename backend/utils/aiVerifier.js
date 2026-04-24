const User = require("../models/User");

/**
 * MOCK AI VERIFICATION WORKER
 * In production: This would call Google Vision API or an LLM-Vision model
 * to extract Bar Council details from the uploaded PDF/Image.
 */
const verifyLawyerCredentials = async (userId, filePath) => {
  console.log(`🤖 AI Verification started for Lawyer: ${userId}`);
  
  try {
    // 1. Simulate AI Analysis Delay
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 2. Mock Extraction (In reality, OCR would run here)
    const mockExtraction = {
      isDocumentValid: true,
      confidence: 0.98,
      extractedName: "MATCHED",
      barIdStatus: "ACTIVE"
    };

    const lawyer = await User.findById(userId);
    if (!lawyer) return;

    if (mockExtraction.isDocumentValid) {
       lawyer.isVerified = true;
       lawyer.verificationStatus = "verified";
       console.log(`✅ AI Verified: ${lawyer.email}`);
    } else {
       lawyer.verificationStatus = "rejected";
       console.log(`❌ AI Rejected: ${lawyer.email}`);
    }

    await lawyer.save();
  } catch (err) {
    console.error("AI Verification Error:", err);
  }
};

module.exports = { verifyLawyerCredentials };
