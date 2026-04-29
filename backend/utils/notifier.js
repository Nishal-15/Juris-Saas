const axios = require("axios");
const twilio = require("twilio");

async function sendAIWhatsApp(phone, userName, caseTitle, context) {
  try {
    // 1. Generate AI Message
    let prompt = "";
    if (context === "booking_accepted") {
      prompt = `Write a 1-sentence WhatsApp notification for a client named ${userName} whose legal consultation for "${caseTitle}" was just ACCEPTED by their lawyer. Be professional and encouraging.`;
    } else if (context === "case_update") {
      prompt = `Write a 1-sentence WhatsApp alert for ${userName} regarding a new status update on their case "${caseTitle}".`;
    } else {
      prompt = `Write a short 1-sentence legal notification for ${userName}.`;
    }

    const aiRes = await axios.post(process.env.PYTHON_AI_SERVICE_URL || "http://127.0.0.1:8088/chat", {
      message: prompt,
      userName: userName
    });

    const text = aiRes.data.answer || "Your legal consultation has been updated.";

    // 2. Send via Twilio
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";

    if (!sid || !token || sid.includes("XXXXX")) {
      console.log(`[WhatsApp Simulation] To ${phone}: ${text}`);
      return;
    }

    const client = twilio(sid, token);
    await client.messages.create({
      from: `whatsapp:${from}`,
      body: text,
      to: `whatsapp:${phone.startsWith("+") ? phone : "+91" + phone}`
    });
    console.log(`[WhatsApp Success] Sent to ${phone}`);
  } catch (err) {
    console.error(`[Notifier Error]:`, err.message);
  }
}

module.exports = { sendAIWhatsApp };
