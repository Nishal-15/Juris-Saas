const mongoose = require("mongoose");
const Lawyer = require("./models/Lawyer"); // 👈 Using the NEW model
const User = require("./models/User");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const lawyersData = [
  { 
    name: "Advocate Nishal", 
    email: "nishal@jurisbot.com", 
    spec: "Criminal & Family Law, Property Disputes", 
    exp: "15 Years", 
    fees: "₹2500/hr", 
    rank: 4.9 
  },
  { 
    name: "Adv. Priya Sharma", 
    email: "priya@jurisbot.com", 
    spec: "Corporate Law, Intellectual Property", 
    exp: "12 Years", 
    fees: "₹3000/hr", 
    rank: 4.8 
  },
  { 
    name: "Advocate Abi", 
    email: "abi@jurisbot.com", 
    spec: "Civil Law, Litigation", 
    exp: "10 Years", 
    fees: "₹2000/hr", 
    rank: 4.7 
  }
];

const seedLawyers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB Cloud...");

        // 1. CLEAN UP: Remove lawyers from 'users' and clean 'lawyers' collection
        console.log("Cleaning old data...");
        await User.deleteMany({ role: "lawyer" });
        await Lawyer.deleteMany({});

        const hashedPassword = bcrypt.hashSync("password123", 10);

        // 2. SEED INTO NEW 'lawyers' COLLECTION
        for (const l of lawyersData) {
            const lawyer = new Lawyer({
                name: l.name,
                email: l.email,
                password: hashedPassword,
                specialization: l.spec,
                experience: l.exp,
                fees: l.fees,
                rating: l.rank,
                location: "NEW DELHI, INDIA",
                isPro: true,
                isVerified: true
            });
            await lawyer.save();
            console.log(`✅ Placed ${l.name} into the 'lawyers' collection`);
        }

        console.log("\n--- SUCCESS: Experts are now in the SEPARATE 'lawyers' collection ---");
        process.exit(0);
    } catch (err) {
        console.error("SEED ERROR:", err);
        process.exit(1);
    }
};

seedLawyers();
