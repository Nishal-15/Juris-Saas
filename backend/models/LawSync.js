const mongoose = require("mongoose")
const LawSyncSchema = new mongoose.Schema({
  syncedAt:      { type: Date, default: Date.now },
  source: {
    type: String,
    enum: [
      "IndianKanoon","IndiaCode",
      "Gazette","ManualUpload"
    ],
    required: true
  },
  documentTitle: { type: String, default: null },
  documentYear:  { type: String, default: null },
  sectionsAdded: { type: Number, default: 0 },
  documentsAdded:{ type: Number, default: 0 },
  status: {
    type: String,
    enum: ["success","failed","partial"],
    default: "success"
  },
  errorMessage:  { type: String, default: null },
  triggeredBy: {
    type: String,
    enum: ["scheduler","admin","manual"],
    default: "scheduler"
  }
}, { timestamps: true })
module.exports = mongoose.model(
  "LawSync", LawSyncSchema
)
