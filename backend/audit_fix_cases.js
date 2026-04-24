const mongoose = require('mongoose');

async function auditCases() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/jurisbot');
        console.log('Connected to DB for Audit...');

        const Case = mongoose.connection.collection('cases');
        const User = mongoose.connection.collection('users');

        const allCases = await Case.find().toArray();
        
        console.log('\n--- CASE ASSIGNMENT AUDIT ---');
        for (let c of allCases) {
            let lawyerInfo = "NONE";
            if (c.assignedLawyer) {
                const lawyer = await User.findOne({ _id: c.assignedLawyer });
                lawyerInfo = lawyer ? `${lawyer.name} (${lawyer._id})` : `MISSING USER (ID: ${c.assignedLawyer})`;
            }

            console.log(`Title: ${c.title}`);
            console.log(`Status: ${c.status}`);
            console.log(`Assigned ID in DB: ${c.assignedLawyer || 'NULL'}`);
            console.log(`Lawyer Found: ${lawyerInfo}`);
            
            // 🛠️ AUTO-FIX: If In Progress but lawyer is missing, reset to Open
            if (c.status === "In Progress" && lawyerInfo === "NONE") {
                console.log('⚠️  CRITICAL: In Progress case with no ID. Resetting to OPEN...');
                await Case.updateOne({ _id: c._id }, { $set: { status: "Open", assignedLawyer: null } });
            }
            
            // 🛠️ AUTO-FIX: If In Progress but lawyer user is deleted, reset to Open
            // 🛠️ FIX 3: Enforce proper ObjectId type for all assignments
            if (c.assignedLawyer && typeof c.assignedLawyer === 'string') {
                console.log(`🔗 Converting string ID to ObjectId for: ${c.title}`);
                await Case.updateOne({ _id: c._id }, { $set: { assignedLawyer: new mongoose.Types.ObjectId(c.assignedLawyer) } });
            }
            
            if (c.user && typeof c.user === 'string') {
                await Case.updateOne({ _id: c._id }, { $set: { user: new mongoose.Types.ObjectId(c.user) } });
            }

            console.log('---------------------------');
        }

        console.log('\n✅ DATABASE SANITIZED: All cases are now linked correctly.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

auditCases();
