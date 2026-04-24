const mongoose = require("mongoose");
const User = require("./backend/models/User");
const Notification = require("./backend/models/Notification");
const connectDB = require("./backend/config/db");

const seed = async () => {
  await connectDB();
  
  // Find a user
  const user = await User.findOne();
  if (user) {
    await Notification.create({
      user: user._id,
      title: "Welcome to JurisBot",
      message: "Your premium legal assistant is ready. Ask your first query in the chat!",
      icon: "🤖"
    });
    console.log("Seeded notification for user:", user.email);
  } else {
    console.log("No user found to seed notification.");
  }
  process.exit();
};

seed();
