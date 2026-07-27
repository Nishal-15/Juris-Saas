const mongoose = require("mongoose");

const LawyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "lawyer" },
  specialization: { type: String },
  experience: { type: String },
  fees: { type: String },
  rating: { type: Number, default: 4.5 },
  location: { type: String, default: "NEW DELHI, INDIA" },
  isVerified: { type: Boolean, default: false },
  phone: { type: String, default: null },
  tier: {
    type: String,
    default: "tier3"
  },
  minFeePerCase: { type: Number, default: 0 },
  maxFeePerCase: { type: Number, default: 0 },
  courtLevels: [{
    type: String
  }],
  caseComplexity: [{
    type: String
  }],
  state: { type: String, default: null },
  city:  { type: String, default: null },
  subscriptionTier: { 
    type: String, 
    default: "Trial" 
  },
  caseLimit: { type: Number, default: 2 }, // Trial limit
  casesClaimedCount: { type: Number, default: 0 },
  subscriptionStartedAt: { type: Date, default: Date.now },
  subscriptionExpiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
  },
  isBlocked: { type: Boolean, default: false },
  refreshToken: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'lawyers', timestamps: true });

module.exports = mongoose.model("Lawyer", LawyerSchema);
