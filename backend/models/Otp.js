const mongoose = require("mongoose");

/* OTP document auto-expires 5 minutes after createdAt */
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // TTL: 5 minutes (MongoDB removes document automatically)
  }
});

module.exports = mongoose.model("Otp", otpSchema);
