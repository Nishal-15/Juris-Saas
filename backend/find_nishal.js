const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function findAdvocateNishal() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.connection.collection('users');
    
    const users = await User.find({ name: /Nishal/i }).toArray();
    console.log(`\n🔍 Found ${users.length} Users with 'Nishal':`);
    users.forEach(u => {
      console.log(`- ID: ${u._id} | Name: ${u.name} | Role: ${u.role}`);
    });

    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}
findAdvocateNishal();
