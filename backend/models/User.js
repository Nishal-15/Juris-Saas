const mongoose = require("mongoose");

module.exports = mongoose.model("User",
 new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  
  // 🌍 Citizen Preferences
  preferredLanguage: { type: String, default: "en" },
  isBlocked: { type: Boolean, default: false },
  
  incomeTier: {
    type: String,
    enum: ["low", "mid", "high"],
    default: "mid"
  },
  monthlyIncome: { type: Number, default: null },
  state:  { type: String, default: null },
  city:   { type: String, default: null },

  // 🔒 Security
  twoFactorOtp: { type: String, default: null },
  twoFactorExpires: { type: Date, default: null },
  refreshToken: { type: String, default: null },
  
  
  createdAt: { type: Date, default: Date.now }
 })
);