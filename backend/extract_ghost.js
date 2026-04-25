const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function extractGhost() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.connection.collection('users');
    const Case = mongoose.connection.collection('cases');

    const ghostID = new mongoose.Types.ObjectId("69ecb4f5821be5a3b1190cd7");
    
    const user = await User.findOne({ _id: ghostID });
    console.log(`\n🕵️‍♂️ Ghost User Profile:`);
    if (user) {
      console.log(`- ID: ${user._id} | Name: ${user.name} | Role: ${user.role} | Email: ${user.email}`);
    } else {
      console.log(`- ID ${ghostID} NOT FOUND in 'users' collection!`);
    }

    const cases = await Case.find({ assignedLawyer: ghostID }).toArray();
    console.log(`\n📂 Cases Assigned to this Ghost ID: ${cases.length}`);
    cases.forEach(c => {
      console.log(`- Title: ${c.title} | Status: ${c.status}`);
    });

    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}
extractGhost();
