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
  isVerified: { type: Boolean, default: true },
  isPro: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'lawyers' }); // 👈 FORCING IT INTO THE 'lawyers' COLLECTION

module.exports = mongoose.model("Lawyer", LawyerSchema);
