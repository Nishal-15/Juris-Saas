const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // 1. Delete all cases
    const caseDeleteResult = await db.collection('cases').deleteMany({});
    console.log(`Deleted ${caseDeleteResult.deletedCount} cases.`);
    
    // 2. Reset lawyer quotas
    const lawyerUpdateResult = await db.collection('lawyers').updateMany({}, { $set: { casesClaimedCount: 0 } });
    console.log(`Reset quotas for ${lawyerUpdateResult.modifiedCount} lawyers.`);
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
