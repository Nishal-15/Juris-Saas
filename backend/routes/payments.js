const router  = require("express").Router()
const crypto  = require("crypto")
const Lawyer  = require("../models/Lawyer")
const auth    = require("../middleware/auth")
const { sendEmail, subscriptionConfirmTemplate } =
  require("../utils/mailer")

const PLANS = {
  Starter:   { amount: 49900,  cases: 10    },
  Pro:       { amount: 199900, cases: 99999 },
  Unlimited: { amount: 499900, cases: 99999 }
}

/* CREATE ORDER */
router.post(
  "/create-order",
  auth(["lawyer"]),
  async (req, res) => {
    try {
      const { planType } = req.body
      if (!PLANS[planType]) {
        return res.status(400).json({
          message: "Invalid plan"
        })
      }

      const Razorpay = require("razorpay")
      const rzp = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      })

      const order = await rzp.orders.create({
        amount:   PLANS[planType].amount,
        currency: "INR",
        receipt:  `juris_${req.user.id}_${Date.now()}`,
        notes: {
          lawyerId: req.user.id,
          planType
        }
      })

      res.json({
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        planType,
        keyId: process.env.RAZORPAY_KEY_ID
      })
    } catch (err) {
      console.error("Razorpay order error:", err)
      res.status(500).json({
        message: err.message
      })
    }
  }
)

/* VERIFY PAYMENT */
router.post(
  "/verify",
  auth(["lawyer"]),
  async (req, res) => {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        planType
      } = req.body

      /* Verify signature */
      const sign =
        razorpay_order_id + "|" +
        razorpay_payment_id
      const expected = crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(sign)
        .digest("hex")

      if (expected !== razorpay_signature) {
        return res.status(400).json({
          message: "Payment verification failed"
        })
      }

      /* Update lawyer subscription */
      const plan  = PLANS[planType]
      const now   = new Date()
      const expiry = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      )

      const lawyer = await Lawyer.findByIdAndUpdate(
        req.user.id,
        {
          subscriptionTier:       planType,
          caseLimit:              plan.cases,
          subscriptionStartedAt:  now,
          subscriptionExpiresAt:  expiry,
          casesClaimedCount:      0
        },
        { new: true }
      )

      /* Send confirmation email */
      try {
        const { subject, html } =
          subscriptionConfirmTemplate(
            lawyer.name, planType, expiry
          )
        await sendEmail({
          to: lawyer.email,
          subject,
          html
        })
      } catch (e) {
        console.error(
          "Subscription email failed:", e
        )
      }

      res.json({
        message: `${planType} plan activated!`,
        tier:   planType,
        expiry,
        paymentId: razorpay_payment_id
      })
    } catch (err) {
      console.error(
        "Payment verify error:", err
      )
      res.status(500).json({
        message: err.message
      })
    }
  }
)

module.exports = router
