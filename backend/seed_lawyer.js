const mongoose = require("mongoose");
const User = require("./models/User");
const Appointment = require("./models/Appointment");
const Case = require("./models/Case");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const lawyersData = [
  { name: "Lawyer Nishal", email: "nishal@jurisbot.com", spec: "Criminal Defense, Family Law, Property Disputes", exp: "12+ Years", fees: "₹1500/hr", rank: 4.8 },
  { name: "Adv. Meera Sharma", email: "meera@jurisbot.com", spec: "Family Law, Divorce and Custody, Inheritance", exp: "8 Years", fees: "₹1200/hr", rank: 4.9 },
  { name: "Siddharth Varma", email: "siddharth@jurisbot.com", spec: "Corporate Law, Mergers, Startup Legal", exp: "10 Years", fees: "₹2500/hr", rank: 4.7 },
  { name: "Ananya Iyer", email: "ananya@jurisbot.com", spec: "Property Disputes, Real Estate, Land Law", exp: "15 Years", fees: "₹1800/hr", rank: 4.9 },
  { name: "Rajesh Khanna", email: "rajesh@jurisbot.com", spec: "Taxation Law, GST, Corporate Tax", exp: "20 Years", fees: "₹3000/hr", rank: 4.6 },
  { name: "Vikram Rathore", email: "vikram@jurisbot.com", spec: "Criminal Law, Civil Litigation", exp: "7 Years", fees: "₹1000/hr", rank: 4.5 },
  { name: "Sneha Kapoor", email: "sneha@jurisbot.com", spec: "Cyber Law, Intellectual Property", exp: "6 Years", fees: "₹1400/hr", rank: 4.8 },
  { name: "Dr. Arvind Swamy", email: "arvind@jurisbot.com", spec: "Constitutional Law, Civil Rights", exp: "25 Years", fees: "₹5000/hr", rank: 5.0 },
  { name: "Karthik Menon", email: "karthik@jurisbot.com", spec: "Labor Law, Employment Contracts", exp: "9 Years", fees: "₹1100/hr", rank: 4.3 },
  { name: "Ishita Malhotra", email: "ishita@jurisbot.com", spec: "Medical Law, Compensation", exp: "11 Years", fees: "₹2000/hr", rank: 4.7 }
];

const cleanSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jurisbot-Saas");
        console.log("Connected to MongoDB...");

        console.log("Cleaning existing data...");
        await User.deleteMany({ role: "lawyer" });
        await Case.deleteMany({});
        await Appointment.deleteMany({});

        const hashedPassword = bcrypt.hashSync("password123", 10);

        // 1. Create Lawyers
        const createdLawyers = [];
        for (const l of lawyersData) {
            const lawyer = new User({
                name: l.name,
                email: l.email,
                password: hashedPassword,
                role: "lawyer",
                specialization: l.spec,
                experience: l.exp,
                fees: l.fees,
                rating: l.rank
            });
            await lawyer.save();
            createdLawyers.push(lawyer);
            console.log(`✅ Seeded: ${l.name}`);
        }

        // 2. Create a Citizen for Testing
        let client = await User.findOne({ role: "user" });
        if (!client) {
            client = await User.create({
                name: "Citizen Nishal",
                email: "citizen@example.com",
                password: hashedPassword,
                role: "user"
            });
        }

        // 3. Seed some unassigned cases for the Marketplace
        const demoCases = [
            { title: "Property Inheritance Issue", type: "Property", desc: "Ancestral land dispute in Punjab." },
            { title: "Marital Separation Support", type: "Family", desc: "Needs guidance on child custody." },
            { title: "Wrongful Dismissal", type: "Labor", desc: "Fired without notice period." },
            { title: "Tax Audit Notice", type: "Taxation", desc: "Received notice for 2023 filings." }
        ];

        for (const dc of demoCases) {
            await Case.create({
                title: dc.title,
                type: dc.type,
                description: dc.desc,
                urgency: "Normal",
                user: client._id,
                status: "Open"
            });
        }
        console.log("✅ Seeded 4 marketplace cases.");

        console.log("\n--- SEED COMPLETE: 10 Lawyers Ready ---");
        process.exit(0);
    } catch (err) {
        console.error("FATAL SEED ERROR:", err);
        process.exit(1);
    }
};

cleanSeed();
