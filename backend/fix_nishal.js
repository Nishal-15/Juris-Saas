const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function fixNishalRole() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const User = mongoose.connection.collection('users');
    
    // Find Nishal
    const nishal = await User.findOne({ name: /Nishal/i });
    if (nishal) {
      console.log(`\n🔍 Found User: ${nishal.name} | Current Role: ${nishal.role}`);
      
      if (nishal.role !== "lawyer") {
        await User.updateOne({ _id: nishal._id }, { $set: { role: "lawyer" } });
        console.log(`✅ Role updated to 'lawyer' for ${nishal.name}`);
      } else {
        console.log(`ℹ️ Role is already 'lawyer'. Checking lawyer specific data...`);
      }
    } else {
      console.log("❌ Nishal not found in 'users' collection.");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Fix failed:", err);
    process.exit(1);
  }
}

fixNishalRole();
