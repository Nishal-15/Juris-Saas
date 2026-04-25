require("dotenv").config({ path: "./backend/.env" });
const mongoose = require("mongoose");
const User = require("./models/User");

async function fixRoles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 🛡️ Find any user with "Admin" in their name or "admin" in their email and ensure their role is "admin"
    const result = await User.updateMany(
      { 
        $or: [
          { name: /Admin/i },
          { email: /admin/i }
        ]
      },
      { $set: { role: "admin" } }
    );

    console.log(`🎯 Role Sync Complete: Updated ${result.modifiedCount} accounts to 'admin' role.`);
    process.exit();
  } catch (err) {
    console.error("❌ Role Sync Failed:", err);
    process.exit(1);
  }
}

fixRoles();
