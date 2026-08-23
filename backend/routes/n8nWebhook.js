/**
 * Juris n8n Integration Routes
 *
 * These are dedicated endpoints that n8n calls back INTO Juris.
 * No existing routes or files are modified.
 *
 * Mounted at: /api/n8n/...
 *
 * ─────────────────────────────────────────
 * AVAILABLE INBOUND WEBHOOKS (n8n → Juris)
 * ─────────────────────────────────────────
 * POST /api/n8n/notify-user        — Send a socket notification to a user
 * POST /api/n8n/notify-lawyer      — Send a socket notification to a lawyer
 * POST /api/n8n/upgrade-lawyer     — Activate a subscription after payment
 * POST /api/n8n/flag-case          — Flag a case for admin review
 * POST /api/n8n/health             — Health-check ping from n8n
 */

const router  = require("express").Router();
const auth    = require("../middleware/auth");
const Lawyer  = require("../models/Lawyer");
const User    = require("../models/User");
const Case    = require("../models/Case");
const Notification = require("../models/Notification");

/* ─────────────────────────────────────────
   SHARED INTERNAL AUTH GUARD
   All inbound n8n webhooks must carry the
   N8N_API_KEY header to prevent spoofing.
───────────────────────────────────────── */
function n8nAuth(req, res, next) {
  const key = process.env.N8N_API_KEY;
  if (!key) {
    // If no key is configured, block all inbound calls
    return res.status(503).json({ message: "n8n integration not configured." });
  }
  const provided = req.headers["x-n8n-api-key"];
  if (provided !== key) {
    return res.status(401).json({ message: "Unauthorized n8n webhook." });
  }
  next();
}

/* ─────────────────────────────────────────
   HEALTH CHECK — n8n can ping this to
   verify the Juris backend is reachable.
───────────────────────────────────────── */
router.get("/health", n8nAuth, (req, res) => {
  res.json({
    status: "ok",
    service: "Juris CourtSync n8n Bridge",
    timestamp: new Date().toISOString()
  });
});

/* ─────────────────────────────────────────
   NOTIFY USER
   n8n sends a real-time socket notification
   to a specific citizen.

   Body: { userId, title, message, icon }
───────────────────────────────────────── */
router.post("/notify-user", n8nAuth, async (req, res) => {
  try {
    const { userId, title, message, icon = "⚖️" } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ message: "userId and message are required." });
    }

    // Persist to DB
    await Notification.create({ user: userId, title: title || "Juris Update", message, icon });

    // Emit via Socket.io if available
    const io = req.app.get("io");
    if (io) {
      io.to(userId.toString()).emit("notification", { text: message });
    }

    res.json({ success: true, delivered: !!io });
  } catch (err) {
    console.error("[n8n] notify-user error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────
   NOTIFY LAWYER
   n8n sends a real-time socket notification
   to a specific lawyer.

   Body: { lawyerId, title, message, icon }
───────────────────────────────────────── */
router.post("/notify-lawyer", n8nAuth, async (req, res) => {
  try {
    const { lawyerId, title, message, icon = "📋" } = req.body;
    if (!lawyerId || !message) {
      return res.status(400).json({ message: "lawyerId and message are required." });
    }

    const io = req.app.get("io");
    if (io) {
      io.to(lawyerId.toString()).emit("notification", { text: message });
    }

    res.json({ success: true, delivered: !!io });
  } catch (err) {
    console.error("[n8n] notify-lawyer error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────
   UPGRADE LAWYER SUBSCRIPTION
   n8n calls this after confirming a Razorpay
   payment event on its side.

   Body: { email, planType }
   planType: "Starter" | "Pro" | "Unlimited"
───────────────────────────────────────── */
const PLANS = {
  Starter:   { cases: 10    },
  Pro:       { cases: 99999 },
  Unlimited: { cases: 99999 }
};

router.post("/upgrade-lawyer", n8nAuth, async (req, res) => {
  try {
    const { email, planType } = req.body;
    if (!email || !planType || !PLANS[planType]) {
      return res.status(400).json({ message: "Valid email and planType (Starter|Pro|Unlimited) are required." });
    }

    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const lawyer = await Lawyer.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      {
        subscriptionTier:      planType,
        caseLimit:             PLANS[planType].cases,
        subscriptionStartedAt: new Date(),
        subscriptionExpiresAt: expiry,
        casesClaimedCount:     0
      },
      { new: true }
    );

    if (!lawyer) {
      return res.status(404).json({ message: "Lawyer not found." });
    }

    console.log(`[n8n] Lawyer ${email} upgraded to ${planType} via n8n`);
    res.json({ success: true, lawyer: { name: lawyer.name, tier: planType, expiry } });
  } catch (err) {
    console.error("[n8n] upgrade-lawyer error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────
   FLAG CASE FOR ADMIN REVIEW
   n8n can flag a case (e.g. after detecting
   a chronic delay pattern or anomaly).

   Body: { caseId, reason }
───────────────────────────────────────── */
router.post("/flag-case", n8nAuth, async (req, res) => {
  try {
    const { caseId, reason } = req.body;
    if (!caseId) return res.status(400).json({ message: "caseId is required." });

    const updated = await Case.findByIdAndUpdate(
      caseId,
      { $set: { adminFlag: reason || "Flagged by n8n automation" } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Case not found." });

    // Broadcast to admin via socket
    const io = req.app.get("io");
    if (io) {
      io.emit("admin-case-flagged", {
        caseId,
        caseTitle: updated.title,
        reason
      });
    }

    res.json({ success: true, case: { id: caseId, title: updated.title } });
  } catch (err) {
    console.error("[n8n] flag-case error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

/* ─────────────────────────────────────────
   BROADCAST SYSTEM ALERT
   n8n triggers a platform-wide broadcast
   (e.g. maintenance notice, court holiday).

   Body: { message, target }
   target: "all" | "lawyer" | "citizen"
───────────────────────────────────────── */
router.post("/broadcast", n8nAuth, async (req, res) => {
  try {
    const { message, title, target = "all" } = req.body;
    if (!message) return res.status(400).json({ message: "message is required." });

    const io = req.app.get("io");
    if (io) {
      if (target === "lawyer" || target === "all") {
        io.emit("institutional-broadcast-lawyer", { title, message, priority: "high" });
      }
      if (target === "citizen" || target === "all") {
        io.emit("institutional-broadcast", { title, message, priority: "high" });
      }
    }

    res.json({ success: true, broadcast: { target, message } });
  } catch (err) {
    console.error("[n8n] broadcast error:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
