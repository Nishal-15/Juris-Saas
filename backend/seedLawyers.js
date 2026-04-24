require("dotenv").config({ path: "backend/.env" });
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash("Lawyer123", salt);

    const lawyers = [
      {
        name: "Adv. Rajesh Kumar",
        email: "rajesh.kumar@jurisbot.com",
        password,
        role: "lawyer",
        specialization: "Criminal Law, Civil Litigation",
        experience: "15",
        isVerified: true,
        verificationStatus: "verified",
        rating: 4.8
      },
      {
        name: "Adv. Priya Sharma",
        email: "priya.sharma@jurisbot.com",
        password,
        role: "lawyer",
        specialization: "Family Law, Corporate Law",
        experience: "12",
        isVerified: true,
        verificationStatus: "verified",
        rating: 4.9
      }
    ];

    for (let l of lawyers) {
      const exists = await User.findOne({ email: l.email });
      if (!exists) {
        await User.create(l);
        console.log(`➕ Added: ${l.name}`);
      } else {
        console.log(`⏩ Skipping: ${l.name} (Already exists)`);
      }
    }

    console.log("✨ Seeding Complete!");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding Failed:", err);
    process.exit(1);
  }
}

seed();
