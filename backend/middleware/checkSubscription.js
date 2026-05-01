const Lawyer = require("../models/Lawyer");

const checkSubscription = async (req, res, next) => {
  try {
    if (req.user.role !== "lawyer") return next();

    const lawyer = await Lawyer.findById(req.user.id);
    if (!lawyer) return res.status(404).json({ message: "Lawyer account not found" });

    const now = new Date();
    const isExpired = lawyer.subscriptionExpiresAt && lawyer.subscriptionExpiresAt < now;

    // 1. STRICT 30-DAY RENEWAL CHECK
    if (isExpired) {
      if (req.method === "POST" || req.method === "PATCH") {
        return res.status(403).json({ 
          message: "Subscription Expired. All plans require monthly renewal. Please renew to continue practicing.",
          expired: true 
        });
      }
    }

    // 2. TIERED CASE LIMITS
    if (req.url.includes("/assign") || req.url.includes("/accept") || req.url.includes("/connect")) {
      const limits = {
        "Trial": 2,
        "Starter": 5,    // ₹499 Plan
        "Pro": Infinity  // ₹1999 Plan
      };

      const tier = lawyer.subscriptionTier || "Trial";
      const currentLimit = limits[tier] || 0;
      
      if (lawyer.casesUsed >= currentLimit || lawyer.casesClaimedCount >= currentLimit) {
        return res.status(403).json({ 
          message: `Case limit reached for your ${tier} plan. Please upgrade to Pro for unlimited access.`,
          limitReached: true,
          currentTier: tier
        });
      }
    }

    next();
  } catch (err) {
    console.error("Subscription Check Error:", err);
    res.status(500).json({ message: "Subscription verification failed" });
  }
};

module.exports = checkSubscription;
