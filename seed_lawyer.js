const mongoose = require("mongoose");
const User = require("./backend/models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "./backend/.env" });

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

const run = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🚀 Connection Success!");

        const countBefore = await User.countDocuments({ role: "lawyer" });
        console.log(`Current lawyers in DB: ${countBefore}`);

        console.log("🧹 Clearing old lawyer records...");
        const delRes = await User.deleteMany({ role: "lawyer" });
        console.log(`Deleted ${delRes.deletedCount} records.`);

        const hashedPassword = bcrypt.hashSync("password123", 10);
        
        console.log("🌱 Planting new lawyer seeds...");
        for (const l of LAWYERS) {
            await User.create({
                ...l,
                password: hashedPassword,
                role: "lawyer",
                specialization: l.spec,
                experience: l.exp,
                fees: l.fees,
                rating: l.rate
            });
            console.log(`+ Added ${l.name}`);
        }

        const countAfter = await User.countDocuments({ role: "lawyer" });
        console.log(`✅ Success! Total lawyers now: ${countAfter}`);
        
        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error("❌ SEED FAILED:", err);
        process.exit(1);
    }
};

run();
