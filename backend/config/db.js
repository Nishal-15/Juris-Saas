const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Initial Connection Error:", error.message);
    process.exit(1);
  }
};

/* Auto-reconnect on unexpected disconnection */
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting reconnection in 5s...");
  setTimeout(() => {
    mongoose.connect(process.env.MONGO_URI).catch(err =>
      console.error("❌ MongoDB Reconnect Failed:", err.message)
    );
  }, 5000);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Runtime Error:", err.message);
});

module.exports = connectDB;
