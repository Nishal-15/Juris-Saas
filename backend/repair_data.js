const mongoose = require('mongoose');
require('dotenv').config();
const Case = require('./models/Case');
const Appointment = require('./models/Appointment');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ DB Connected\n");

  const lawyerId = "69ecb4f5821be5a3b1190cd9"; // Adv. Priya Sharma

  // Fix Nishal's Case
  const resCase = await Case.updateMany(
    { title: /Encroachment/i, assignedLawyer: null },
    { $set: { assignedLawyer: lawyerId, status: "Pending Expert Acceptance" } }
  );
  console.log(`Updated ${resCase.modifiedCount} cases for Nishal.`);

  // Fix Nishal's Appointment
  const resAppt = await Appointment.updateMany(
    { status: "Accepted", lawyerId: null },
    { $set: { lawyerId: lawyerId } }
  );
  console.log(`Updated ${resAppt.modifiedCount} appointments for Nishal.`);

  process.exit();
}

fix();
