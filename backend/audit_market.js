const mongoose = require("mongoose");
const Case = require("./models/Case");
const User = require("./models/User");
require("dotenv").config();

async function checkMarketplace() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🔍 Checking Marketplace Matching for Experts...");

  const meera = await User.findOne({ email: /meera/i });
  console.log(`Expert: ${meera.name} | Specialization: ${meera.specialization}`);

  const openCases = await Case.find({ assignedLawyer: null });
  console.log(`\nUnassigned Cases in Market: ${openCases.length}`);
  openCases.forEach(c => {
    console.log(`- Title: ${c.title} | Type: ${c.type} | ID: ${c._id.toString().slice(-5)}`);
  });

  const keywords = meera.specialization?.split(/[&,]/).map(k => k.trim()) || [];
  const matches = openCases.filter(c => 
    keywords.some(kw => c.type && c.type.toLowerCase().includes(kw.toLowerCase()))
  );

  console.log(`\n✅ Matches for Meera: ${matches.length}`);
  matches.forEach(m => console.log(`   * ${m.title}`));

  mongoose.connection.close();
}

checkMarketplace();
