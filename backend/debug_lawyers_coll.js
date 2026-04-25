const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function debugLawyersCollection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Lawyer = mongoose.connection.collection('lawyers');
    
    const lawyers = await Lawyer.find({ name: /Nishal/i }).toArray();
    console.log(`\n🔍 Found ${lawyers.length} Lawyers in 'lawyers' collection:`);
    lawyers.forEach(l => {
      console.log(`- ID: ${l._id} | Name: ${l.name} | Email: ${l.email}`);
    });

    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}
debugLawyersCollection();
