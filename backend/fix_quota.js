const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Find all cases assigned to Nishal that are actively accepted
    const activeCases = await db.collection('cases').find({
        assignedLawyer: new mongoose.Types.ObjectId('69ecb4f5821be5a3b1190cd7'),
        status: { $in: ["In Progress", "Hearing Scheduled", "Verdict Pending", "Accepted", "Mediation in Progress"] }
    }).toArray();

    const actualActiveCount = activeCases.length;
    
    // Update the lawyer's casesClaimedCount
    await db.collection('lawyers').updateOne(
        { _id: new mongoose.Types.ObjectId('69ecb4f5821be5a3b1190cd7') },
        { $set: { casesClaimedCount: actualActiveCount } }
    );

    console.log(`Successfully recalculated usage quota. Lawyer now has ${actualActiveCount} active cases.`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
