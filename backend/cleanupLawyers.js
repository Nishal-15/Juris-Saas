require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const User = require("./models/User");

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const emailsToRemove = [
      "rajesh.kumar@jurisbot.com",
      "priya.sharma@jurisbot.com"
    ];

    const result = await User.deleteMany({ email: { $in: emailsToRemove } });
    console.log(`🧹 Cleanup Complete: Removed ${result.deletedCount} seed advocates.`);

    process.exit();
  } catch (err) {
    console.error("❌ Cleanup Failed:", err);
    process.exit(1);
  }
}

cleanup();
