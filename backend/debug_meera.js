const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();
const fs = require('fs');

async function debugMeera() {
  await mongoose.connect(process.env.MONGO_URI);
  const meera = await User.findOne({ email: /meera/i });
  const result = {
    Expert: meera.name,
    Email: meera.email,
    Specialization: meera.specialization,
    Role: meera.role
  };
  fs.writeFileSync('meera_status.json', JSON.stringify(result, null, 2));
  console.log("✅ Meera's Expert Status Exported!");
  mongoose.connection.close();
}

debugMeera();
