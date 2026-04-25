const mongoose = require("mongoose");
require("dotenv").config();
const Case = require("./models/Case");
const Lawyer = require("./models/Lawyer");

async function debug() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        const abiId = "69ecb4f5821be5a3b1190cdb"; // 🎯 REAL ABI ID
        
        const lawyer = await Lawyer.findById(abiId);
        console.log("\n👤 LAWYER INFO:");
        console.log(lawyer ? `Found: ${lawyer.name}` : "❌ NOT FOUND IN LAWYERS COLLECTION");

        const casesByAbi = await Case.find({ assignedLawyer: abiId });
        console.log("\n📂 CASES ASSIGNED TO ABI (BY STRING ID):");
        console.log(`Count: ${casesByAbi.length}`);

        const casesByAbiObj = await Case.find({ assignedLawyer: new mongoose.Types.ObjectId(abiId) });
        console.log("\n📂 CASES ASSIGNED TO ABI (BY OBJECT ID):");
        console.log(`Count: ${casesByAbiObj.length}`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
