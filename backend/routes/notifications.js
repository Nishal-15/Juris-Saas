const router = require("express").Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

/* GET: List User Notifications */
router.get("/", auth(), async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* PATCH: Mark as Read */
router.patch("/:id/read", auth(), async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
       { _id: req.params.id, user: req.user.id },
       { isRead: true },
       { new: true }
    );
    res.json(n);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* DELETE: Clear All History */
router.delete("/all", auth(), async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });
    res.json({ message: "Notification history cleared." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
