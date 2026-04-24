const mongoose = require("mongoose");
const User = require("./backend/models/User");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jurisbot-Saas";

const LAWYERS = [
  { name: "Advocate Nishal", email: "nishal@jurisbot.com", spec: "Criminal & Family Law", exp: "15 Years", fees: "₹1500/hr", rate: 4.9, avatar: "👨‍⚖️" },
  { name: "Adv. Priya Sharma", email: "priya@jurisbot.com", spec: "Corporate Law, IP", exp: "12 Years", fees: "₹2500/hr", rate: 4.8, avatar: "👩‍💼" },
  { name: "Adv. Rajesh Kumar", email: "rajesh@jurisbot.com", spec: "Property Disputes", exp: "20 Years", fees: "₹1800/hr", rate: 4.7, avatar: "👨‍💼" },
  { name: "Adv. Anjali Gupta", email: "anjali@jurisbot.com", spec: "Family & Matrimonial", exp: "10 Years", fees: "₹1200/hr", rate: 4.6, avatar: "👩‍🏫" },
  { name: "Adv. Vikram Singh", email: "vikram@jurisbot.com", spec: "Cyber Law Specialist", exp: "8 Years", fees: "₹2000/hr", rate: 4.9, avatar: "👨‍💻" },
  { name: "Adv. Meera Reddy", email: "meera@jurisbot.com", spec: "Taxation & GST", exp: "14 Years", fees: "₹2200/hr", rate: 4.5, avatar: "⚖️" },
  { name: "Adv. Suresh Iyer", email: "suresh@jurisbot.com", spec: "Medical Negligence", exp: "18 Years", fees: "₹1600/hr", rate: 4.8, avatar: "👨‍🔬" },
  { name: "Adv. Kavita Bose", email: "kavita@jurisbot.com", spec: "Civil Litigation", exp: "11 Years", fees: "₹1400/hr", rate: 4.7, avatar: "👩‍⚖️" },
  { name: "Adv. Rohan Mehra", email: "rohan@jurisbot.com", spec: "Immigration Law", exp: "9 Years", fees: "₹2100/hr", rate: 4.4, avatar: "✈️" },
  { name: "Adv. Pooja Verma", email: "pooja@jurisbot.com", spec: "Banking & Insolvency", exp: "13 Years", fees: "₹1900/hr", rate: 4.6, avatar: "💰" }
];

async function seed() {
  try {
    console.log("Connecting...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");
    
    console.log("Removing all current lawyers...");
    await User.deleteMany({ role: "lawyer" });
    
    const hash = bcrypt.hashSync("password123", 10);
    
    for (const l of LAWYERS) {
      await User.create({
        ...l,
        password: hash,
        role: "lawyer",
        specialization: l.spec,
        experience: l.exp,
        fees: l.fees,
        rating: l.rate
      });
      console.log(`+ ${l.name}`);
    }
    
    console.log("DONE.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
