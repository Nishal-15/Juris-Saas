const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jurisbot-Saas";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Admin Seeding...");

    // 1. Create Nishal Admin
    const adminEmail = "nishal-admin@jurisbot.com";
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log("Admin account already exists.");
    } else {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await User.create({
        name: "Nishal Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });
      console.log("✅ Admin account 'Nishal Admin' (Password: admin123) created successfully.");
      console.log("   Now login at: http://localhost:5173/");
    }

    process.exit();
  } catch (err) {
    console.error("Seeding Error:", err);
    process.exit(1);
  }
};

seedAdmin();
