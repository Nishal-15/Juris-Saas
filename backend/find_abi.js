const mongoose = require("mongoose");
require("dotenv").config();

async function findAbi() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        
        const abiId = new mongoose.Types.ObjectId("69ea4cdb154448a4b7a2f325");
        
        console.log("Checking Users...");
        const inUsers = await db.collection("users").findOne({ _id: abiId });
        console.log(inUsers ? `Found in Users: ${JSON.stringify(inUsers, null, 2)}` : "Not in Users");

        console.log("\nChecking Lawyers...");
        const inLawyers = await db.collection("lawyers").findOne({ _id: abiId });
        console.log(inLawyers ? `Found in Lawyers: ${JSON.stringify(inLawyers, null, 2)}` : "Not in Lawyers");

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findAbi();
