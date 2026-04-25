const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function fixAssignments() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // 1. Find Abi
    const abi = await db.collection('users').findOne({ name: /Abi/i });
    const nishal = await db.collection('lawyers').findOne({ name: /Nishal/i });

    if (abi && nishal) {
      console.log(`⚖️ Abi ID: ${abi._id} | Nishal ID: ${nishal._id}`);

      // 2. Return Civil/Encroachment cases to Abi (or unassign if she's not a lawyer)
      const updateResult = await db.collection('cases').updateMany(
        { title: /Encroachment/i },
        { $set: { assignedLawyer: abi._id } }
      );
      console.log(`✅ Returned ${updateResult.modifiedCount} Encroachment cases to Abi.`);
    }

    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}
fixAssignments();
