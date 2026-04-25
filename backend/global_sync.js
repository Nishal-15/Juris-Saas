const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function globalSync() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // 1. YOUR REAL ID (The one you are logged in as)
    const REAL_ID = new mongoose.Types.ObjectId("69ea769816079442bdb418a7");

    // 2. THE GHOST IDs (From your screenshots and my debug)
    const GHOST_IDS = [
      new mongoose.Types.ObjectId("69ecb4f5821be5a3b1190cd7"),
      new mongoose.Types.ObjectId("69ecb4f5821be5a3b1190cdb")
    ];

    console.log(`📡 Starting Global Sync to ID: ${REAL_ID}`);

    // --- SYNC CASES ---
    const caseResult = await db.collection('cases').updateMany(
      { assignedLawyer: { $in: GHOST_IDS } },
      { $set: { assignedLawyer: REAL_ID } }
    );
    console.log(`✅ Cases Synced: ${caseResult.modifiedCount}`);

    // --- SYNC APPOINTMENTS ---
    const apptResult = await db.collection('appointments').updateMany(
      { lawyerId: { $in: GHOST_IDS } },
      { $set: { lawyerId: REAL_ID } }
    );
    console.log(`✅ Appointments Synced: ${apptResult.modifiedCount}`);

    // --- SYNC LAWYERS PROFILE ---
    await db.collection('lawyers').updateOne(
      { _id: REAL_ID },
      { 
        $set: {
          name: "Advocate Nishal",
          email: "nishal@jurisbot.com",
          role: "lawyer",
          specialization: "Criminal, Civil, Property Dispute",
          experience: "12",
          rating: 4.9,
          isVerified: true,
          isPro: true,
          subscriptionTier: "Professional",
          casesClaimedCount: 1,
          subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isBlocked: false,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log("✅ Lawyer Profile Synced/Updated with Professional Tier.");

    // --- SYNC ANALYTICS Fallback ---
    // Some systems cache stats, we might need to recalculate or just wait for refresh

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
globalSync();
