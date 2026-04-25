const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function syncNishal() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.connection.collection('users');
    const Lawyer = mongoose.connection.collection('lawyers');
    const Case = mongoose.connection.collection('cases');

    // 1. Find the User account Nishal is using (Admin one we fixed earlier)
    const userAcc = await User.findOne({ name: /Nishal Admin/i });
    const realID = userAcc._id;
    
    console.log(`🚀 Real User ID to sync: ${realID}`);

    // 2. Remove the 'Ghost' lawyer and create/update the lawyer profile with the REAL ID
    await Lawyer.deleteOne({ name: /Nishal/i });
    
    await Lawyer.insertOne({
      _id: realID, // 👈 MATCHING THE USER ID
      name: "Advocate Nishal",
      email: "nishal@jurisbot.com",
      role: "lawyer",
      specialization: "Criminal, Civil, Property Dispute",
      experience: "12",
      rating: 4.9,
      isVerified: true,
      isPro: true,
      createdAt: new Date()
    });
    console.log("✅ Lawyer Profile synced with User ID.");

    // 3. Update the cases that were assigned to the old ghost ID
    const ghostID = new mongoose.Types.ObjectId("69ecb4f5821be5a3b1190cd7");
    const updateResult = await Case.updateMany(
      { assignedLawyer: ghostID },
      { $set: { assignedLawyer: realID } }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} cases from Ghost ID to Real ID.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
syncNishal();
