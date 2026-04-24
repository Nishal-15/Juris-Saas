const cron = require("node-cron");
const Case = require("../models/Case");
const axios = require("axios");

// 🕒 Check every morning at 8:00 AM
cron.schedule("0 8 * * *", async () => {
  console.log("🔔 Running daily hearing notification scan...");
  try {
    const today = new Date();
    const after48h = new Date();
    after48h.setDate(today.getDate() + 2);

    // Format dates for comparison
    const todayStr = today.toISOString().split("T")[0];
    const after48hStr = after48h.toISOString().split("T")[0];

    const cases = await Case.find({
      hearingDate: { $in: [todayStr, after48hStr] },
      status: "In Progress"
    }).populate("user assignedLawyer");

    for (const c of cases) {
       const isToday = c.hearingDate === todayStr;
       const message = isToday 
         ? `COURT DAY: Your hearing for case #${c._id} (${c.title}) is scheduled for TODAY. Please ensure all documents are ready.`
         : `REMINDER: You have a legal hearing scheduled in 48 hours for case #${c._id}.`;

       // 📱 Send to Lawyer
       if (c.assignedLawyer?.phone) {
         sendWhatsApp(c.assignedLawyer.phone, message);
       }
       
       // 📱 Send to Citizen
       if (c.user?.phone) {
         sendWhatsApp(c.user.phone, message);
       }
    }
  } catch (err) {
    console.error("Scheduler Error:", err);
  }
});

async function sendWhatsApp(phone, text) {
  // 🔌 INTEGRATION POINT: Twilio / Interakt / etc.
  console.log(`[WhatsApp API] Sending to ${phone}: ${text}`);
  
  /* Example Implementation with Twilio:
  const client = require('twilio')(sid, auth);
  await client.messages.create({
    from: 'whatsapp:+14155238886',
    body: text,
    to: `whatsapp:${phone}`
  });
  */
}
