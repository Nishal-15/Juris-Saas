const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function fixAppointments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // 1. Abi's Real ID (from my previous check)
    const abiID = new mongoose.Types.ObjectId("69ed1e613fe12c3f68ffb5ab");
    const nishalID = new mongoose.Types.ObjectId("69ecb4f5821be5a3b1190cd7");

    console.log(`⚖️ Re-linking appointments to Abi (${abiID})...`);

    // 2. Find appointments for the "Encroachment" case and give them back to Abi
    const caseObj = await db.collection('cases').findOne({ title: /Encroachment/i });
    
    if (caseObj) {
      const updateResult = await db.collection('appointments').updateMany(
        { caseId: caseObj._id },
        { $set: { lawyerId: abiID } }
      );
      console.log(`✅ Returned ${updateResult.modifiedCount} appointments to Abi.`);
    } else {
      console.log("❌ Encroachment case not found to link appointments.");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fixAppointments();
