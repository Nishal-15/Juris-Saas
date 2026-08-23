const router = require("express").Router();
const Lawyer = require("../models/Lawyer");
const auth = require("../middleware/auth");

// Get All Lawyers from the 'lawyers' collection
router.get("/", async (req, res) => {
  try {
    const page  = parseInt(req.query.page  || "1");
    const limit = parseInt(req.query.limit || "50");
    const skip  = (page - 1) * limit;

    const [lawyers, total] = await Promise.all([
      Lawyer.find({ isVerified: true })
        .select("-password")
        .skip(skip)
        .limit(limit),
      Lawyer.countDocuments({ isVerified: true })
    ]);

    res.json({
      lawyers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const Case = require("../models/Case");

// GET Current Lawyer Profile & Subscription Status
router.get("/me", auth(["lawyer"]), async (req, res) => {
  try {
    const lawyer = await Lawyer.findById(req.user.id).select("-password");
    if (!lawyer) return res.status(404).json({ message: "Lawyer not found" });

    // Sync cases count from database (counting only cases assigned since current subscription started)
    const startAt = lawyer.subscriptionStartedAt || lawyer.createdAt || new Date(0);
    const casesCount = await Case.countDocuments({
      assignedLawyer: lawyer._id,
      createdAt: { $gte: startAt }
    });
    lawyer.casesClaimedCount = casesCount;
    await lawyer.save();

    const exceeded = lawyer.caseLimit !== 9999 && casesCount >= lawyer.caseLimit;

    // Send lawyer object with limitExceeded boolean
    res.json({
      ...lawyer.toObject(),
      limitExceeded: exceeded
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPGRADE/RENEW Subscription (Simulated Payment)
router.patch("/upgrade", auth(["lawyer"]), async (req, res) => {
  try {
    const { planType } = req.body; // "Starter" or "Pro"
    
    if (!planType ||
        !["Starter","Pro","Unlimited"].includes(planType)
    ) {
      return res.status(400).json({
        message:
          "Invalid plan. " +
          "Choose Starter, Pro, or Unlimited."
      })
    }

    const plans = {
      "Starter": { limit: 10    },
      "Pro":     { limit: 99999 }
    };

    if (!plans[planType]) {
      return res.status(400).json({ message: "Invalid plan type" });
    }

    const lawyer = await Lawyer.findById(req.user.id);
    if (!lawyer) return res.status(404).json({ message: "Lawyer not found" });

    const now = new Date();
    let newExpiry;

    // If already active, ADD 30 days to current expiry. If expired, start from NOW.
    if (lawyer.subscriptionExpiresAt && lawyer.subscriptionExpiresAt > now) {
      newExpiry = new Date(lawyer.subscriptionExpiresAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      newExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Reset usage count for the new billing cycle
    lawyer.subscriptionTier = planType;
    lawyer.caseLimit = plans[planType].limit;
    lawyer.subscriptionExpiresAt = newExpiry;
    lawyer.subscriptionStartedAt = now;
    lawyer.casesClaimedCount = 0; // 🔄 RESET QUOTA FOR THE NEW MONTH

    await lawyer.save();

    res.json({ 
      message: `Successfully ${lawyer.subscriptionTier === planType ? 'Renewed' : 'Upgraded'} to ${planType}!`, 
      lawyer 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
