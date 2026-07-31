const cron = require("node-cron");
const Case = require("../models/Case");
const axios = require("axios");
const twilio = require("twilio");
const { spawn } = require("child_process");
const path      = require("path");
const { getAIChatURL } = require("./aiUrl");

// 🕒 Check every morning at 8:00 AM
cron.schedule("0 8 * * *", async () => {
  console.log("🔔 Running daily hearing notification scan...");
  try {
    const today = new Date();
    const after48h = new Date();
    after48h.setDate(today.getDate() + 2);

    // Format dates for comparison (YYYY-MM-DD)
    const todayStr = today.toISOString().split("T")[0];
    const after48hStr = after48h.toISOString().split("T")[0];

    const cases = await Case.find({
      hearingDate: { $in: [todayStr, after48hStr] },
      status: "In Progress"
    }).populate("user assignedLawyer");

    for (const c of cases) {
       const isToday = c.hearingDate === todayStr;
       
       // 🤖 Generate AI Alert Message
       const aiMessage = await generateAILegalAlert(c, isToday);

       // 📱 Send to Lawyer
       if (c.assignedLawyer?.phone) {
         sendWhatsApp(c.assignedLawyer.phone, aiMessage);
       }
       
       // 📱 Send to Citizen
       if (c.user?.phone) {
         sendWhatsApp(c.user.phone, aiMessage);
       }
    }
  } catch (err) {
    console.error("Scheduler Error:", err);
  }
});

async function generateAILegalAlert(caseData, isToday) {
  try {
    const prompt = isToday 
      ? `Write a 1-sentence professional legal reminder for a client whose court hearing is TODAY for case: "${caseData.title}". Be professional and encouraging.`
      : `Write a 1-sentence legal reminder for a client who has a hearing in 48 hours for case: "${caseData.title}". Remind them to be prepared.`;

    const aiRes = await axios.post(getAIChatURL(), {
      message: prompt,
      userName: caseData.user?.name || "Citizen"
    });

    return aiRes.data.answer || "This is a reminder for your upcoming legal hearing.";
  } catch (err) {
    console.error("AI Alert Gen Error:", err.message);
    return isToday 
      ? `COURT DAY: Your hearing for case "${caseData.title}" is scheduled for TODAY.`
      : `REMINDER: You have a legal hearing scheduled in 48 hours for case "${caseData.title}".`;
  }
}

async function sendWhatsApp(phone, text) {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId || accessToken.includes("your_whatsapp")) {
    console.log(`[WhatsApp Simulation] To ${phone}: ${text}`);
    return;
  }

  try {
    // WhatsApp Cloud API requires numbers without the '+' sign
    const recipient = phone.startsWith("+") ? phone.substring(1) : (phone.startsWith("91") ? phone : "91" + phone);
    
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: "jurisbot_hearing_reminder",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: text }
              ]
            }
          ]
        }
      },
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`[WhatsApp Cloud API Success] Sent to ${phone}`);
  } catch (err) {
    console.error(`[WhatsApp Cloud API Failure] To ${phone}:`, err.response?.data || err.message);
  }
}

/* WEEKLY LAW AUTO-SYNC — Sunday 2AM */
cron.schedule("0 2 * * 0", async () => {
  console.log(
    "⚖️ [LawSync] Weekly sync starting..."
  )
  try {
    const LawSync =
      require("../models/LawSync")
    const syncRecord = await LawSync.create({
      source:      "IndianKanoon",
      triggeredBy: "scheduler",
      status:      "partial"
    })
    const scriptPath = path.join(
      __dirname,
      "../ai-service/auto_fetch.py"
    )
    const py = spawn("python", [
      scriptPath,
      "--source", "all",
      "--sync-id",
      syncRecord._id.toString()
    ])
    py.stdout.on("data", d =>
      console.log(
        "[LawSync Weekly]", d.toString()
      )
    )
    py.stderr.on("data", d =>
      console.error(
        "[LawSync Error]", d.toString()
      )
    )
    py.on("close", async code => {
      await LawSync.findByIdAndUpdate(
        syncRecord._id,
        {
          status: code === 0 ?
            "success" : "failed",
          errorMessage: code !== 0 ?
            `Exit code ${code}` : null
        }
      )
      console.log(
        `[LawSync] Weekly done. Code: ${code}`
      )
    })
  } catch (err) {
    console.error(
      "[LawSync] Scheduler error:", err
    )
  }
})

/* MONTHLY FAISS REBUILD — 1st of month 3AM */
cron.schedule("0 3 1 * *", async () => {
  console.log(
    "🔄 [FAISS] Monthly rebuild starting..."
  )
  try {
    const scriptPath = path.join(
      __dirname,
      "../ai-service/build_index.py"
    )
    const py = spawn("python", [scriptPath])
    py.stdout.on("data", d =>
      console.log(
        "[FAISS Rebuild]", d.toString()
      )
    )
    py.on("close", code =>
      console.log(
        `[FAISS Rebuild] Done. Code: ${code}`
      )
    )
  } catch (err) {
    console.error(
      "[FAISS Rebuild] Error:", err
    )
  }
})

/* 14-DAY TRIAL NUDGES — Daily 9AM */
cron.schedule("0 9 * * *", async () => {
  try {
    const Lawyer = require("../models/Lawyer")
    const now    = new Date()

    const nudgeLawyers = await Lawyer.find({
      subscriptionTier: "Trial",
      subscriptionExpiresAt: {
        $gte: now,
        $lte: new Date(
          now.getTime() +
          4 * 24 * 60 * 60 * 1000
        )
      }
    })

    for (const lawyer of nudgeLawyers) {
      const daysLeft = Math.ceil(
        (lawyer.subscriptionExpiresAt - now) /
        (1000 * 60 * 60 * 24)
      )
      if (!lawyer.phone) continue

      if (daysLeft <= 1) {
        sendWhatsApp(
          lawyer.phone,
          `Hi ${lawyer.name}, your JurisBot ` +
          `trial ends TOMORROW. Upgrade to ` +
          `Starter at ₹499/month to keep your ` +
          `cases active: jurisbot.in/upgrade`
        )
      } else if (daysLeft <= 4) {
        sendWhatsApp(
          lawyer.phone,
          `Hi ${lawyer.name}, ${daysLeft} days ` +
          `left on your JurisBot trial. Upgrade ` +
          `to continue receiving cases: ` +
          `jurisbot.in/upgrade`
        )
      }
    }
  } catch (err) {
    console.error("[Trial Nudge] Error:", err)
  }
})

/* EMERGENCY CASE ESCALATION — Every 30 min */
cron.schedule("*/30 * * * *", async () => {
  try {
    const Case   = require("../models/Case")
    const twoHrs = new Date(
      Date.now() - 2 * 60 * 60 * 1000
    )
    const urgent = await Case.find({
      urgency:        "Emergency",
      assignedLawyer: null,
      createdAt:      { $lte: twoHrs }
    }).populate("user", "name");

    for (const c of urgent) {
      let io = null;
      try {
        const serverModule = require("../server");
        io = serverModule?.io ||
          serverModule?.app?.get?.("io") ||
          null;
      } catch {
        /* server not yet loaded */
      }
      if (io) {
        io.emit("emergency-unassigned", {
          caseId:    c._id,
          caseTitle: c.title,
          message:
            `URGENT: Case "${c.title}" ` +
            `unassigned for 2+ hours`
        });
      } else {
        console.warn(
          `[Emergency] io not available. ` +
          `Case ${c._id} needs attention.`
        );
      }
      console.log(
        `[Emergency Escalation] ` +
        `Case ${c._id} unassigned 2hrs+`
      );
    }
  } catch (err) {
    console.error(
      "[Emergency Escalation] Error:", err
    )
  }
})
