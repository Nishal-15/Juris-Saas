const mongoose = require("mongoose");
const Lawyer = require("./models/Lawyer");
const Case = require("./models/Case");
require("dotenv").config({ path: ".env" });

async function fixNishal() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const lawyer = await Lawyer.findOne({ name: /Nishal/i });
    if (!lawyer) {
      console.log("❌ Advocate Nishal not found.");
      process.exit(0);
    }

    console.log(`Found lawyer: ${lawyer.name} (ID: ${lawyer._id})`);

    const now = new Date();
    lawyer.subscriptionTier = "Trial";
    lawyer.caseLimit = 2;
    lawyer.subscriptionStartedAt = now;
    lawyer.subscriptionExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    lawyer.casesClaimedCount = 0;

    await lawyer.save();
    console.log("✅ Advocate Nishal reset to 30-day Trial plan with 0 starting cases!");
    process.exit(0);
  } catch (err) {
    console.error("Error updating Nishal subscription:", err);
    process.exit(1);
  }
}
fixNishal();
