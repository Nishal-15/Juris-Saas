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
  subscriptionTier: { 
    type: String, 
    enum: ["Trial", "Starter", "Pro", "Expired"], 
    default: "Trial" 
  },
  caseLimit: { type: Number, default: 2 }, // Trial limit
  casesClaimedCount: { type: Number, default: 0 },
  subscriptionStartedAt: { type: Date, default: Date.now },
  subscriptionExpiresAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'lawyers', timestamps: true });

module.exports = mongoose.model("Lawyer", LawyerSchema);
