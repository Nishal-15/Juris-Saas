const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function finalHandshakeFix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    // 🎯 THE REAL ID FROM YOUR TERMINAL LOGS
    const REAL_LOGGED_IN_ID = new mongoose.Types.ObjectId("69ecb4f5821be5a3b1190cd7");

    console.log(`📡 FORCING SYNC TO ACTIVE TERMINAL ID: ${REAL_LOGGED_IN_ID}`);

    // 0. CLEANUP: Delete any other lawyer profiles with the same email
    await db.collection('lawyers').deleteMany({ email: "nishal@jurisbot.com" });
    console.log("🧹 Cleaned up duplicate email accounts.");

    // 1. Restore/Upsert the Lawyer Profile with the EXACT ID from your session
    await db.collection('lawyers').updateOne(
      { _id: REAL_LOGGED_IN_ID },
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
          casesClaimedCount: 5,
          subscriptionExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          isBlocked: false,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    console.log("✅ Lawyer Profile Restored with Active ID.");

    // 2. Move ALL cases (regardless of previous ghost IDs) to this Active ID
    const caseResult = await db.collection('cases').updateMany(
      { assignedLawyer: { $ne: null } }, // Update any assigned case to YOU for testing
      { $set: { 
          assignedLawyer: REAL_LOGGED_IN_ID,
          status: "Pending Expert Acceptance" 
        } 
      }
    );
    console.log(`✅ Cases Re-assigned to Active ID: ${caseResult.modifiedCount}`);

    // 3. Move appointments too
    const apptResult = await db.collection('appointments').updateMany(
      {}, 
      { $set: { lawyerId: REAL_LOGGED_IN_ID } }
    );
    console.log(`✅ Appointments Re-assigned: ${apptResult.modifiedCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
finalHandshakeFix();
