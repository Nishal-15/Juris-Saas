const mongoose = require("mongoose");
require("dotenv").config();

async function createLink() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;

        const citizenId = new mongoose.Types.ObjectId("69ea889382260e59c1cd933c"); // Your Citizen ID
        const abiId = new mongoose.Types.ObjectId("69ecb4f5821be5a3b1190cdb"); // Advocate Abi
        const caseId = new mongoose.Types.ObjectId("69ea8c6682260e59c1cd93fd"); // Your Case

        console.log("🔗 CREATING ACTIVE CONSULTATION LINK...");

        // Create the missing Appointment
        const appointment = {
            userId: citizenId,
            lawyerId: abiId,
            caseId: caseId,
            date: "24/04/2026",
            time: "10:30 AM",
            status: "Accepted"
        };

        await db.collection("appointments").insertOne(appointment);
        console.log("✅ Appointment Created!");

        console.log("\n🚀 DONE! Refresh your Citizen page—the button will now be GREEN.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createLink();
