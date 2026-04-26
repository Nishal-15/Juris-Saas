const router=require("express").Router();
const User=require("../models/User");
const Lawyer=require("../models/Lawyer");
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
    const lawyerId = req.user.id;
    const activeStatuses = ["In Progress", "Hearing Scheduled", "Verdict Pending"];
    const pendingStatuses = ["Pending Expert Acceptance", "Requested"];

    // 1. Total Active Cases (In Progress, etc.)
    const totalCases = await Case.countDocuments({ 
      assignedLawyer: lawyerId,
      status: { $in: activeStatuses } 
    });

    // 2. Pending Reviews (Consultation Queue)
    const pendingApps = await Case.countDocuments({ 
      assignedLawyer: lawyerId, 
      status: { $in: pendingStatuses } 
    });

    // 3. Active Clients (Unique Users in Active Cases)
    const activeClients = await Case.distinct("user", { 
      assignedLawyer: lawyerId,
      status: { $in: activeStatuses }
    });

    let lawyer = await Lawyer.findById(lawyerId, "name subscriptionTier casesClaimedCount subscriptionExpiresAt isBlocked");
    if (!lawyer) {
      lawyer = await User.findById(lawyerId, "name subscriptionTier casesClaimedCount subscriptionExpiresAt isBlocked");
    }

    res.json({
      expertName: lawyer?.name || "Expert Advocate",
      totalCases,
      pendingApps,
      activeClients: activeClients.length,
      subscription: {
        tier: lawyer?.subscriptionTier || "Trial",
        count: lawyer?.casesClaimedCount || 0,
        expiry: lawyer?.subscriptionExpiresAt,
        isBlocked: lawyer?.isBlocked || false
      }
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin", auth(["admin"]), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const lawyerUsersCount = await User.countDocuments({ role: "lawyer" });
    const standaloneLawyersCount = await Lawyer.countDocuments({ isVerified: true });
    
    const totalLawyers = lawyerUsersCount + standaloneLawyersCount;
    const totalCases = await Case.countDocuments();
    const emergencyCases = await Case.countDocuments({ urgency: "Emergency" });

    // 🔬 PENDING CASES: Awaiting Expert assignment
    const pendingCases = await Case.find({ assignedLawyer: null })
      .sort({ createdAt: -1 })
      .populate("user", "name");

    // 📁 ALL CASES: For the Admin "Marketplace" view
    const allCases = await Case.find()
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .populate("assignedLawyer", "name");

    res.json({
      stats: {
        totalUsers,
        totalLawyers,
        totalCases,
        emergencyCases
      },
      pendingCases,
      allCases
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;