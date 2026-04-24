const mongoose = require("mongoose");
const Appointment = require("./models/Appointment");
const Case = require("./models/Case");
require("dotenv").config();

async function checkData() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🔍 Analyzing Legal Data Consistency...");

  const appointments = await Appointment.find().populate('userId').populate('lawyerId');
  console.log(`\n📅 Appointments Found: ${appointments.length}`);
  
  appointments.forEach(a => {
    console.log(`- Request from: ${a.userId?.name} to: ${a.lawyerId?.name} | Status: ${a.status} | CaseID: ${a.caseId || 'MISSING'}`);
  });

  const cases = await Case.find();
  console.log(`\n📁 Total Cases in System: ${cases.length}`);
  cases.forEach(c => {
    console.log(`- Case: ${c.title} (#${c._id.toString().slice(-5)}) | Citizen: ${c.userId} | Assigned: ${c.assignedLawyer || 'PENDING'}`);
  });

  mongoose.connection.close();
}

checkData();
