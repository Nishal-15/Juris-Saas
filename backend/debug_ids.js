const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function debugIDs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const Case = mongoose.connection.collection('cases');
    const User = mongoose.connection.collection('users');

    const cases = await Case.find({ status: "Pending Expert Acceptance" }).toArray();
    console.log(`\n📂 Pending Cases:`);
    cases.forEach(c => {
      console.log(`- Case: ${c.title} | AssignedLawyerID: ${c.assignedLawyer}`);
    });

    const nishals = await User.find({ name: /Nishal/i }).toArray();
    console.log(`\n👨‍⚖️ Nishal Users:`);
    nishals.forEach(n => {
      console.log(`- ID: ${n._id} | Name: ${n.name} | Role: ${n.role}`);
    });

    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}
debugIDs();
