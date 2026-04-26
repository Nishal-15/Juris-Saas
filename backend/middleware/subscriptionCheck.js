const Lawyer = require("../models/Lawyer");

module.exports = function(actionType = "view") {
  return async (req, res, next) => {
    try {
      if (req.user.role !== "lawyer") return next();

      const lawyer = await Lawyer.findById(req.user.id);
      if (!lawyer) return res.status(404).json({ message: "Lawyer account not found." });

      const now = new Date();
      const isExpired = lawyer.subscriptionExpiresAt && now > lawyer.subscriptionExpiresAt;

      // 1. IF EXPIRED -> VIEW ONLY MODE
      if (isExpired || lawyer.subscriptionTier === "Expired") {
        if (actionType === "write") {
          return res.status(403).json({ 
            message: "Subscription Expired. Your account is in View-Only mode. Please renew to continue accepting cases.",
            isExpired: true
          });
        }
        return next();
      }

      // 2. CASE LIMIT CHECK (For Trial and Pro)
      if (actionType === "accept_case") {
        const limits = {
          "Trial": 2,
          "Pro": 5,
          "Unlimited": Infinity
        };

        const currentLimit = limits[lawyer.subscriptionTier] || 0;
        if (lawyer.casesClaimedCount >= currentLimit) {
          return res.status(403).json({ 
            message: `Case limit reached for your ${lawyer.subscriptionTier} plan. Upgrade to Unlimited for infinite cases.`,
            limitReached: true
          });
        }
      }

      next();
    } catch (err) {
      console.error("Subscription Middleware Error:", err);
      res.status(500).json({ message: "Internal server error during subscription check." });
    }
  };
};
