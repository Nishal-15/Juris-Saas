const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");
const Lawyer = require("./models/Lawyer");

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to DB");

        // Find all users who are actually lawyers
        const ghostLawyers = await User.find({ role: "lawyer" });
        console.log(`🔍 Found ${ghostLawyers.length} lawyers stuck in the 'users' collection.`);

        for (const ghost of ghostLawyers) {
            console.log(`📦 Moving ${ghost.name} (${ghost.email})...`);
            
            // Check if already in Lawyers (just in case)
            const exists = await Lawyer.findOne({ email: ghost.email });
            if (!exists) {
                const lawyerData = ghost.toObject();
                delete lawyerData._id; // Let it create a new ID OR keep the same one? 
                // We MUST keep the same ID because the CASES use this ID!
                
                await Lawyer.collection.insertOne(ghost.toObject());
                console.log(`✅ ${ghost.name} successfully migrated with ID: ${ghost._id}`);
                
                // Optional: Remove from Users collection to avoid confusion
                // await User.findByIdAndDelete(ghost._id);
            } else {
                console.log(`⏩ ${ghost.name} already exists in lawyers collection.`);
            }
        }

        console.log("\n🚀 MIGRATION COMPLETE! Refresh your dashboard.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

migrate();
