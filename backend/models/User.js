const mongoose = require("mongoose");

module.exports = mongoose.model("User",
 new mongoose.Schema({
  name:String,
  email:String,
  password:String,
  phone: String,
  role: { type: String, enum: ["user", "lawyer", "admin"], default: "user" },
  
  // 👩‍⚖️ Lawyer Specific Fields
  specialization: { type: String },
  experience: { type: String },
  fees: { type: String },
  rating: { type: Number, default: 0 },
  avatar: { type: String },
  
  // 🛡️ Verification System
  barId: { type: String },
  certificateUrl: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },

  // 💰 Subscription & Limits
  subscriptionTier: { type: String, enum: ["trial", "basic", "premium"], default: "trial" },
  subscriptionExpiresAt: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) }, // 30 Days Free
  casesClaimedCount: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },

  preferredLanguage: { type: String, default: "en" },
  createdAt: { type: Date, default: Date.now }
 })
);