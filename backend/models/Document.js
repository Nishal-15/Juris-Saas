const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  fileUrl: String,
  type: { type: String, enum: ["PDF", "IMG", "DOC", "OTHER"], default: "PDF" },
  size: String
}, { timestamps: true });

module.exports = mongoose.model("Document", DocumentSchema);
