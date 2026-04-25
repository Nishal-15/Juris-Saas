const mongoose = require("mongoose");

const CaseSchema = new mongoose.Schema({
  title: String,
  type: String,
  description: String,
  urgency: {
    type: String,
    enum: ["Normal", "Urgent", "Emergency"],
    default: "Normal"
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Hearing Scheduled", "Verdict Pending", "Closed"],
    default: "Open"
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  assignedLawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lawyer",
    default: null
  },
  trackingHistory: [{
    status: String,
    date: { type: Date, default: Date.now }
  }],
  hearingDate: Date,
  courtLocation: String,
  nextSteps: String,
  verdict: String
}, { timestamps: true });

module.exports = mongoose.model("Case", CaseSchema);
