const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Lawyer = require('./models/Lawyer');
const Case = require('./models/Case');
const Appointment = require('./models/Appointment');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ DB Connected for Migration\n");

  const abiUser = await User.findOne({ email: "abi@gmail.com" });
  if (!abiUser) {
    console.log("❌ Abi not found in User collection.");
    process.exit();
  }

  console.log(`🔍 Found Abi User: ${abiUser._id}`);

  // 1. Create Lawyer Entry for Abi
  let abiLawyer = await Lawyer.findOne({ email: "abi@gmail.com" });
  if (!abiLawyer) {
    abiLawyer = await Lawyer.create({
      name: abiUser.name,
      email: abiUser.email,
      password: abiUser.password, // Keep same password
      role: "lawyer",
      specialization: "Civil, Property",
      experience: "5",
      isVerified: true
    });
    console.log(`✅ Created Abi Lawyer: ${abiLawyer._id}`);
  } else {
    console.log(`ℹ️ Abi Lawyer already exists: ${abiLawyer._id}`);
  }

  // 2. Re-link ALL cases pointing to Abi's OLD User ID
  const caseRes = await Case.updateMany(
    { assignedLawyer: abiUser._id },
    { $set: { assignedLawyer: abiLawyer._id } }
  );
  console.log(`✅ Re-linked ${caseRes.modifiedCount} cases to Abi's Lawyer ID.`);

  // 3. Re-link ALL appointments pointing to Abi's OLD User ID
  const apptRes = await Appointment.updateMany(
    { lawyerId: abiUser._id },
    { $set: { lawyerId: abiLawyer._id } }
  );
  console.log(`✅ Re-linked ${apptRes.modifiedCount} appointments to Abi's Lawyer ID.`);

  // 4. Update the actual case (Encroachment) just in case
  const encroachment = await Case.updateMany(
    { title: /Encroachment/i },
    { $set: { assignedLawyer: abiLawyer._id, status: "Pending Expert Acceptance" } }
  );
  console.log(`✅ Forced sync for Encroachment cases: ${encroachment.modifiedCount}`);

  console.log("\n🚀 Migration Complete! Dashboards should now sync perfectly.");
  process.exit();
}

migrate();
