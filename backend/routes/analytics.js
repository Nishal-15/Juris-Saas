const router=require("express").Router();
const User=require("../models/User");
const Case=require("../models/Case");

const auth = require("../middleware/auth");
const Appointment = require("../models/Appointment");

router.get("/", async (req, res) => {
  res.json({
    users: await User.countDocuments(),
    cases: await Case.countDocuments()
  });
});

router.get("/lawyer", auth(["lawyer"]), async (req, res) => {
  try {
    const totalCases = await Case.countDocuments({ assignedLawyer: req.user.id });
    const pendingApps = await Appointment.countDocuments({ 
      lawyerId: req.user.id, 
      status: { $in: ["Scheduled", "Pending"] } 
    });
    const activeClients = await Case.distinct("user", { assignedLawyer: req.user.id });

    const lawyer = await User.findById(req.user.id, "name subscriptionTier casesClaimedCount subscriptionExpiresAt isBlocked");

    res.json({
      expertName: lawyer?.name || "Expert Advocate",
      totalCases,
      pendingApps,
      activeClients: activeClients.length,
      subscription: {
        tier: lawyer.subscriptionTier,
        count: lawyer.casesClaimedCount,
        expiry: lawyer.subscriptionExpiresAt,
        isBlocked: lawyer.isBlocked
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin", auth(["admin"]), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $in: ["user", "admin"] } });
    const totalLawyers = await User.countDocuments({ role: "lawyer", isVerified: true });
    const totalCases = await Case.countDocuments();
    const emergencyCases = await Case.countDocuments({ urgency: "Emergency" });

    const recentCases = await Case.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "name")
      .populate("assignedLawyer", "name");

    res.json({
      stats: {
        totalUsers,
        totalLawyers,
        totalCases,
        emergencyCases
      },
      recentCases
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;