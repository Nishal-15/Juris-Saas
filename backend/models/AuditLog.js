const mongoose = require("mongoose");
const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. "VERIFY_LAWYER", "BLOCK_CITIZEN"
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetModel: { type: String, enum: ["User", "Lawyer", "Case"] },
  details: { type: Object, default: {} },
  ip: { type: String },
  timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model("AuditLog", auditLogSchema);
