const User = require("../models/User");
const Lawyer = require("../models/Lawyer");

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

    let lawyer = await Lawyer.findById(userId);
    if (!lawyer) {
      lawyer = await User.findById(userId);
    }
    if (!lawyer) {
      console.log(`❌ Lawyer document not found in DB for ID: ${userId}`);
      return;
    }

    if (mockExtraction.isDocumentValid) {
       lawyer.isVerified = false;
       lawyer.verificationStatus = "pending";
       console.log(`✅ AI Analysis Complete for ${lawyer.email}. Status: Pending Admin Institutional Approval.`);
    } else {
       lawyer.isVerified = false;
       lawyer.verificationStatus = "pending";
       console.log(`⚠ AI Analysis Flagged for ${lawyer.email}. Status: Pending Admin Institutional Approval.`);
    }

    await lawyer.save();
  } catch (err) {
    console.error("AI Verification Error:", err);
  }
};

module.exports = { verifyLawyerCredentials };
