const axios = require("axios");
const { Resend } = require("resend");
const { getAIChatURL } = require("./aiUrl");
const twilio = require("twilio");
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

async function sendWithRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
    }
  }
}

async function sendAINotification(target, userName, caseTitle, context, lang = "en") {
  try {
    const langMap = {
      hi: "Hindi", bn: "Bengali", te: "Telugu", mr: "Marathi", ta: "Tamil",
      gu: "Gujarati", kn: "Kannada", ml: "Malayalam", pa: "Punjabi",
      or: "Odia", ur: "Urdu", en: "English"
    };
    const langName = langMap[lang] || "English";

    // 1. Generate AI Message
    let prompt = "";
    if (context === "booking_accepted") {
      prompt = `Write a 1-sentence notification in ${langName} for a client named ${userName} whose legal consultation for "${caseTitle}" was just ACCEPTED by their lawyer. Be professional and encouraging. Write ONLY in ${langName}.`;
    } else if (context === "case_update") {
      prompt = `Write a 1-sentence alert in ${langName} for ${userName} regarding a new status update on their case "${caseTitle}". Write ONLY in ${langName}.`;
    } else {
      prompt = `Write a short 1-sentence legal notification in ${langName} for ${userName}. Write ONLY in ${langName}.`;
    }

    const aiRes = await axios.post(getAIChatURL(), {
      message: prompt,
      userName: userName,
      lang: lang
    });

    const text = aiRes.data.answer || "Your legal consultation has been updated.";

    // 2. Branch: Send via WhatsApp if target is phone number
    if (target && !String(target).includes("@")) {
      if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
        console.log(`[WhatsApp Simulation] To: ${target} Message: ${text}`);
        return;
      }
      try {
        const formattedPhone = String(target).startsWith("whatsapp:") ? String(target) : `whatsapp:${target}`;
        const formattedFrom = process.env.TWILIO_PHONE_NUMBER.startsWith("whatsapp:") ? process.env.TWILIO_PHONE_NUMBER : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;
        await sendWithRetry(() => twilioClient.messages.create({
          body: text,
          from: formattedFrom,
          to: formattedPhone
        }));
        console.log(`[WhatsApp Success] Sent to ${formattedPhone}`);
      } catch (twErr) {
        console.warn(`[WhatsApp Warning] Failed to send message to ${target}: ${twErr.message}`);
      }
      return;
    }

    // 3. Send via Resend if email
    const email = target;
    if (!resend) {
      console.log(`[Email Simulation] To: ${email}`);
      return;
    }

    const isRtl = ["ur", "ks", "sd"].includes(lang);
    const dirAttr = isRtl
      ? 'dir="rtl" style="text-align: right; font-family: Arial, Tahoma, sans-serif; direction: rtl;"'
      : 'dir="ltr" style="text-align: left; direction: ltr;"';

    await sendWithRetry(() => resend.emails.send({
      from: "JurisBot Notifications <onboarding@resend.dev>",
      to: email,
      subject: `Case Update: ${caseTitle}`,
      html: `
        <div ${dirAttr}>
          <p style="margin-bottom: 12px;">
            Dear ${userName},
          </p>
          <p style="line-height: 1.6;">
            ${text}
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #64748b;">
            JurisBot Legal AI — Automated Notification
          </p>
        </div>
      `
    }));
    console.log(`[Email Success] Sent to ${email}`);
  } catch (err) {
    console.error(`[Notifier Error]:`, err.message);
  }
}

async function sendOtpEmail(email, otp) {
  try {
    if (!resend) {
      console.log(`[Email Simulation] To: ${email}`);
      return;
    }

    await sendWithRetry(() => resend.emails.send({
      from: "JurisBot Security <onboarding@resend.dev>",
      to: email,
      subject: `Your Admin Login OTP: ${otp}`,
      html: `
        <div dir="ltr" style="text-align: left; direction: ltr; font-family: Arial, sans-serif;">
          <p style="margin-bottom: 12px;">You are attempting to log into the JurisBot Admin Dashboard.</p>
          <h2 style="margin: 16px 0; color: #1e293b;">${otp}</h2>
          <p style="line-height: 1.6; margin-bottom: 20px;">This code expires in 10 minutes. If you did not request this, please change your password immediately.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="font-size: 12px; color: #64748b;">JurisBot Security — Automated Alert</p>
        </div>
      `
    }));
    console.log(`[OTP Success] Sent to ${email}`);
  } catch (err) {
    console.error(`[Notifier Error]:`, err.message);
  }
}

// We keep the old function name exported so we don't break existing imports, but it now sends emails
module.exports = { sendAIWhatsApp: sendAINotification, sendOtpEmail };
