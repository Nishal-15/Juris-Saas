const router = require("express").Router();
const crypto = require("crypto");
const Lawyer = require("../models/Lawyer");

const PLANS = {
  Starter:   { cases: 10    },
  Pro:       { cases: 99999 },
  Unlimited: { cases: 99999 }
};

router.post("/razorpay", async (req, res) => {
  try {
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!secret || !signature) {
      return res.status(400).json({ message: "Missing webhook signature or secret." });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody || JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("[Webhook] Invalid signature attempt.");
      return res.status(400).json({ message: "Invalid signature." });
    }

    const event   = req.body.event;
    const payload = req.body.payload;

    if (event === "payment.captured" || event === "subscription.charged") {
      const email = payload.payment?.entity?.notes?.email
                 || payload.subscription?.entity?.notes?.email;
      const plan  = payload.payment?.entity?.notes?.plan || "Pro";

      if (email) {
        const lawyer = await Lawyer.findOne({ email: email.toLowerCase() });
        if (lawyer) {
          const planConfig = PLANS[plan] || PLANS.Pro;
          lawyer.subscriptionTier      = plan;
          lawyer.caseLimit             = planConfig.cases;
          lawyer.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await lawyer.save();
          console.log(`[Webhook] Upgraded lawyer ${email} to ${plan} (limit: ${planConfig.cases})`);
        }
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[Webhook Error]:", err.message);
    res.status(500).json({ message: "Webhook handler failed." });
  }
});

module.exports = router;
