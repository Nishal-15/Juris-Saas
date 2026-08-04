const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, refPath: "onModel" },
  onModel: { type: String, enum: ["User", "Lawyer"], default: "User" },
  title: String,
  message: String,
  icon: String,
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", NotificationSchema);
