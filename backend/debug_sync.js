const mongoose = require('mongoose');
require('dotenv').config();
const Case = require('./models/Case');
const Appointment = require('./models/Appointment');
const Lawyer = require('./models/Lawyer');
const User = require('./models/User');

async function debug() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ DB Connected for Debugging\n");

  const cases = await Case.find().populate('user', 'name').populate('assignedLawyer', 'name');
  const appts = await Appointment.find().populate('userId', 'name').populate('lawyerId', 'name');

  console.log("=== CASES IN SYSTEM ===");
  cases.forEach(c => {
    console.log(`[${c.status}] Title: ${c.title} | User: ${c.user?.name} (${c.user?._id}) | Lawyer: ${c.assignedLawyer?.name} (${c.assignedLawyer?._id})`);
  });

  console.log("\n=== APPOINTMENTS IN SYSTEM ===");
  appts.forEach(a => {
    console.log(`[${a.status}] User: ${a.userId?.name} (${a.userId?._id}) | Lawyer: ${a.lawyerId?.name} (${a.lawyerId?._id})`);
  });

  process.exit();
}

debug();
