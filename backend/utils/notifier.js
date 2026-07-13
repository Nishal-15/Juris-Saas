const axios = require("axios");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY || "re_123");

async function sendAINotification(email, userName, caseTitle, context) {
  try {
    // 1. Generate AI Message
    let prompt = "";
    if (context === "booking_accepted") {
      prompt = `Write a 1-sentence notification for a client named ${userName} whose legal consultation for "${caseTitle}" was just ACCEPTED by their lawyer. Be professional and encouraging.`;
    } else if (context === "case_update") {
      prompt = `Write a 1-sentence alert for ${userName} regarding a new status update on their case "${caseTitle}".`;
    } else {
      prompt = `Write a short 1-sentence legal notification for ${userName}.`;
    }

    const aiRes = await axios.post(process.env.PYTHON_AI_SERVICE_URL || "http://127.0.0.1:8088/chat", {
      message: prompt,
      userName: userName
    });

    const text = aiRes.data.answer || "Your legal consultation has been updated.";

    // 2. Send via Resend
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes("placeholder")) {
      console.log(`[Email Simulation] To ${email}: ${text}`);
      return;
    }

    await resend.emails.send({
      from: "JurisBot Notifications <onboarding@resend.dev>",
      to: email,
      subject: `Case Update: ${caseTitle}`,
      html: `<p>Dear ${userName},</p><p>${text}</p>`
    });
    console.log(`[Email Success] Sent to ${email}`);
  } catch (err) {
    console.error(`[Notifier Error]:`, err.message);
  }
}

// We keep the old function name exported so we don't break existing imports, but it now sends emails
module.exports = { sendAIWhatsApp: sendAINotification };
