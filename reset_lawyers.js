const mongoose = require("mongoose");
const User = require("./backend/models/User");
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jurisbot-Saas";

async function clear() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");
    console.log("🧹 Clearing the deck for the Advocate Gallery...");
    await User.deleteMany({ role: "lawyer" });
    console.log("Ready! Refresh your browser now.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
clear();
