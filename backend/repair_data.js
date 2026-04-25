const mongoose = require("mongoose");
require("dotenv").config();

async function repair() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        const ghostIdStr = "69ea4cdb154448a4b7a2f325";
        const realIdStr = "69ecb4f5821be5a3b1190cdb"; // Advocate Abi
        
        const ghostId = new mongoose.Types.ObjectId(ghostIdStr);
        const realId = new mongoose.Types.ObjectId(realIdStr);

        console.log(`🛠️ REPAIRING: Moving data from ${ghostIdStr} -> ${realIdStr}...`);

        // 1. Update Cases
        const caseUpdate = await db.collection("cases").updateMany(
            { assignedLawyer: ghostId },
            { $set: { assignedLawyer: realId } }
        );
        console.log(`✅ Updated ${caseUpdate.modifiedCount} Cases.`);

        // 2. Update Appointments
        const appUpdate = await db.collection("appointments").updateMany(
            { lawyerId: ghostId },
            { $set: { lawyerId: realId } }
        );
        console.log(`✅ Updated ${appUpdate.modifiedCount} Appointments.`);

        console.log("\n🚀 REPAIR COMPLETE! Abi will now see her cases and clients.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

repair();
