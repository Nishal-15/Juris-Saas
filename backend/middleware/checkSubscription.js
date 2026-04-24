const User = require("../models/User");

const checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "lawyer") return next();

    // 1. Check Expiry
    const now = new Date();
    if (user.subscriptionExpiresAt < now) {
      user.isBlocked = true;
      await user.save();
      return res.status(403).json({ 
        message: "Your subscription has expired. Please renew to continue accepting cases.",
        expired: true 
      });
    }

    // 2. Check Case Limits
    const limits = {
      trial: 2,
      basic: 5,
      premium: Infinity
    };

    const currentLimit = limits[user.subscriptionTier] || 0;
    if (user.casesClaimedCount >= currentLimit) {
      return res.status(403).json({ 
        message: `You have reached the limit for the ${user.subscriptionTier} plan (${currentLimit} cases). Upgrade for more access.`,
        limitReached: true
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: "Subscription verification failed" });
  }
};

module.exports = checkSubscription;
