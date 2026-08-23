const mongoose = require("mongoose");

const CaseSchema = new mongoose.Schema({
  title: String,
  type: String,
  category: String,
  legalType: String,
  incidentDate: String,
  description: String,
  urgency: {
    type: String,
    enum: ["Normal", "Urgent", "Emergency"],
    default: "Normal"
  },
  status: {
    type: String,
    enum: [
      "Open",
      "Pending Expert Acceptance",
      "Requested",
      "In Progress",
      "Hearing Scheduled",
      "Verdict Pending",
      "Closed",
      "Pending Mediation",
      "Pending Mediation Acceptance",
      "Mediation in Progress",
      "Mediation Session Scheduled",
      "Mutual Settlement Reached",
      "Resolved"
    ],
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
  verdict: String,
  courtLevel: {
    type: String,
    enum: [
      "District Court","High Court",
      "Supreme Court","Consumer Forum",
      "Tribunal","Family Court"
    ],
    default: null
  },
  complexity: {
    type: String,
    enum: ["Low","Mid","High"],
    default: "Mid"
  },
  estimatedFeeRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  clientIncomeTier: {
    type: String,
    enum: ["low","mid","high"],
    default: "mid"
  },
  isMediationEligible: {
    type: Boolean,
    default: false
  },
  isMediationTrack: {
    type: Boolean,
    default: false
  },
  mediationScript:  { type: String, default: null },
  mediationVideoUrl:{ type: String, default: null },
  courtExplanation: {
    why: String,
    timeline: String,
    estimatedCost: String,
    nextStep: String
  },
  evidence: {
    type:    [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model("Case", CaseSchema);
