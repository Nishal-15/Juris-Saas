const mongoose = require("mongoose");
const Appointment = require("./models/Appointment");
const User = require("./models/User");
require("dotenv").config();

async function debugLawyers() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🔍 Debugging Lawyer Dashboards...");

  const lawyers = await User.find({ role: "lawyer" });
  for (const l of lawyers) {
    const pendingCount = await Appointment.countDocuments({ lawyerId: l._id });
    console.log(`👨‍⚖️ Lawyer: ${l.name} (${l.email}) | Pending Requests: ${pendingCount}`);
    
    if (pendingCount > 0) {
      const apps = await Appointment.find({ lawyerId: l._id }).populate('userId');
      apps.forEach(a => {
        console.log(`   - Request from: ${a.userId?.name} | Status: ${a.status}`);
      });
    }
  }

  mongoose.connection.close();
}

debugLawyers();
