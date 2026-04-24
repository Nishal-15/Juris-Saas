const mongoose = require("mongoose");
const User = require("./models/User");
const Appointment = require("./models/Appointment");
require("dotenv").config();
const fs = require('fs');

async function debugData() {
  await mongoose.connect(process.env.MONGO_URI);
  let res = "Debug Results:\n\n";

  const meeras = await User.find({ name: /Meera/i });
  res += `Meera Records Found: ${meeras.length}\n`;
  meeras.forEach(m => {
    res += `- ${m.name} (${m.email}) ID: ${m._id}\n`;
  });

  const apps = await Appointment.find().populate('userId').populate('lawyerId');
  res += `\nAppointments:\n`;
  apps.forEach(a => {
    res += `- From: ${a.userId?.name} to Lawyer: ${a.lawyerId?.name} (${a.lawyerId?.email}) | Status: ${a.status}\n`;
  });

  fs.writeFileSync('debug_nishal.txt', res);
  mongoose.connection.close();
}

debugData();
