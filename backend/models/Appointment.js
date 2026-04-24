const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: "Case" }, // 🔥 Link to Case
  date: String,
  time: String,
  status: { type: String, default: "Scheduled" }
});

module.exports = mongoose.model("Appointment", AppointmentSchema);
