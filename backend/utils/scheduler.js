const cron = require("node-cron");
const Case = require("../models/Case");
const axios = require("axios");
const twilio = require("twilio");

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

    const aiRes = await axios.post(process.env.PYTHON_AI_SERVICE_URL || "http://127.0.0.1:8088/chat", {
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
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";

  if (!sid || !token || sid.includes("XXXXX")) {
    console.log(`[WhatsApp Simulation] To ${phone}: ${text}`);
    return;
  }

  try {
    const client = twilio(sid, token);
    await client.messages.create({
      from: `whatsapp:${from}`,
      body: text,
      to: `whatsapp:${phone.startsWith("+") ? phone : "+91" + phone}` // Default to India if no prefix
    });
    console.log(`[WhatsApp Success] Sent to ${phone}`);
  } catch (err) {
    console.error(`[WhatsApp Failure] To ${phone}:`, err.message);
  }
}
