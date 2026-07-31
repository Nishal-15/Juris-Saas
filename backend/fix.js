const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // 1. Reset all Trial lawyers to caseLimit 5 and casesClaimedCount 0
    await db.collection('lawyers').updateMany({ subscriptionTier: 'Trial' }, { $set: { caseLimit: 5, casesClaimedCount: 0 } });
    console.log('Reset Trial case limits to 5 and usage to 0');
    
    // 2. See who matches "Corporate"
    const res = await db.collection('lawyers').find({ isVerified: true, isBlocked: false, specialization: { $regex: 'Corporate', $options: 'i' } }).toArray();
    console.log('Matched Corporate Lawyers:', res.map(l => ({ name: l.name, tier: l.tier })));
    
    // 3. Let's fix tier formats in DB (change tier3 to tier_3, tier2 to tier_2, tier1 to tier_1)
    await db.collection('lawyers').updateMany({ tier: 'tier3' }, { $set: { tier: 'tier_3' } });
    await db.collection('lawyers').updateMany({ tier: 'tier2' }, { $set: { tier: 'tier_2' } });
    await db.collection('lawyers').updateMany({ tier: 'tier1' }, { $set: { tier: 'tier_1' } });
    console.log('Standardized tier formats in DB');

    process.exit(0);
});
