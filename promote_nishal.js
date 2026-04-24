const mongoose = require("mongoose");
const User = require("./backend/models/User");
require("dotenv").config({ path: "./backend/.env" });

const run = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected!");

        const user = await User.findOneAndUpdate({ name: /Nishal/i }, { role: "admin" }, { new: true });
        if (user) {
            console.log(`✅ Success! ${user.email} is now an ADMIN.`);
        } else {
            console.log("❌ No user found with name 'Nishal'.");
        }
        process.exit();
    } catch (err) {
        console.error("FATAL:", err);
        process.exit(1);
    }
};
run();
