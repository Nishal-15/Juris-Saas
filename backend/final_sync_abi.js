const mongoose = require('mongoose');
require('dotenv').config();
const Case = require('./models/Case');
const Appointment = require('./models/Appointment');
const Lawyer = require('./models/Lawyer');

async function fixFinal() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ DB Connected for Final Sync\n");

  const correctLawyerId = "69ecb4f5821be5a3b1190cdb"; // abi@jurisbot.com
  const duplicateLawyerId = "69edbd26a28099b732d0933c"; // abi@gmail.com

  // 1. Re-link everything to the CORRECT Jurisbot ID
  const caseRes = await Case.updateMany(
    { $or: [{ assignedLawyer: duplicateLawyerId }, { title: /Encroachment/i }] },
    { $set: { assignedLawyer: correctLawyerId, status: "Pending Expert Acceptance" } }
  );
  console.log(`✅ Re-linked ${caseRes.modifiedCount} cases to abi@jurisbot.com.`);

  const apptRes = await Appointment.updateMany(
    { $or: [{ lawyerId: duplicateLawyerId }, { status: "Accepted" }] },
    { $set: { lawyerId: correctLawyerId } }
  );
  console.log(`✅ Re-linked ${apptRes.modifiedCount} appointments to abi@jurisbot.com.`);

  // 2. Remove the duplicate entry
  await Lawyer.findByIdAndDelete(duplicateLawyerId);
  console.log(`🗑️ Deleted duplicate gmail account.`);

  console.log("\n🚀 FINAL SYNC COMPLETE! Use abi@jurisbot.com / password123 to login.");
  process.exit();
}

fixFinal();
