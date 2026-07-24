const { google } = require("googleapis")

const createTransporter = async () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  )
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  })
  const accessToken = await oauth2Client
    .getAccessToken()
  return { oauth2Client, accessToken }
}

const encodeEmail = ({ to, subject, html }) => {
  const from = process.env.GMAIL_SENDER_ADDRESS ||
    "admin@jurisbot.in"
  const emailLines = [
    `From: JurisBot <${from}>`,
    `To: ${to}`,
    "Content-Type: text/html; charset=utf-8",
    "MIME-Version: 1.0",
    `Subject: ${subject}`,
    "",
    html
  ]
  return Buffer.from(
    emailLines.join("\n")
  ).toString("base64url")
}

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_REFRESH_TOKEN
    ) {
      console.log(
        `[Gmail Simulation] To: ${to} | ` +
        `Subject: ${subject}`
      )
      return
    }
    const { oauth2Client } =
      await createTransporter()
    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client
    })
    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodeEmail({ to, subject, html })
      }
    })
    console.log(`✅ [Gmail] Sent to ${to}`)
  } catch (err) {
    console.error("❌ [Gmail] Send error:", err)
    throw err
  }
}

/* ── EMAIL TEMPLATES ── */

const BASE_STYLE = `
  font-family: 'Inter', Arial, sans-serif;
  max-width: 520px;
  margin: 0 auto;
  background: #0d0f1a;
  color: white;
  border-radius: 16px;
  overflow: hidden;
`
const GOLD = "#c9a84c"

const otpTemplate = (otp, userName) => ({
  subject: "JurisBot — Your Security Code",
  html: `<div style="${BASE_STYLE}">
    <div style="background:${GOLD};padding:20px 30px">
      <h2 style="margin:0;color:#0d0f1a;
        font-family:Georgia,serif">
        JurisBot Security Code
      </h2>
    </div>
    <div style="padding:30px">
      <p>Hello ${userName || "User"},</p>
      <p>Your verification code is:</p>
      <div style="text-align:center;margin:24px 0">
        <span style="font-size:2.5rem;
          font-weight:800;letter-spacing:12px;
          color:${GOLD}">${otp}</span>
      </div>
      <p style="color:#94a3b8;font-size:0.85rem">
        Valid for 10 minutes.<br>
        If you did not request this, ignore
        this email.
      </p>
    </div>
  </div>`
})

const lawyerApprovedTemplate = (lawyerName) => ({
  subject: "JurisBot — Your Profile is Verified ✓",
  html: `<div style="${BASE_STYLE}">
    <div style="background:#059669;padding:20px 30px">
      <h2 style="margin:0;color:white;
        font-family:Georgia,serif">
        Profile Verified ✓
      </h2>
    </div>
    <div style="padding:30px">
      <p>Congratulations ${lawyerName}!</p>
      <p>Your JurisBot profile is now verified.
        You can start accepting cases immediately.
      </p>
      <a href="https://jurisbot.in"
        style="display:inline-block;
        background:${GOLD};color:#0d0f1a;
        padding:12px 24px;border-radius:8px;
        font-weight:700;text-decoration:none;
        margin-top:16px">
        Open JurisBot
      </a>
    </div>
  </div>`
})

const lawyerRejectedTemplate = (lawyerName) => ({
  subject: "JurisBot — Application Status Update",
  html: `<div style="${BASE_STYLE}">
    <div style="background:#334155;padding:20px 30px">
      <h2 style="margin:0;color:white;
        font-family:Georgia,serif">
        Application Under Review
      </h2>
    </div>
    <div style="padding:30px">
      <p>Dear ${lawyerName},</p>
      <p>Your application requires additional review.
        Please contact support@jurisbot.in for
        assistance.
      </p>
    </div>
  </div>`
})

const caseAssignedTemplate = (
  citizenName, lawyerName, caseTitle
) => ({
  subject: "JurisBot — A Lawyer Has Accepted Your Case",
  html: `<div style="${BASE_STYLE}">
    <div style="background:${GOLD};padding:20px 30px">
      <h2 style="margin:0;color:#0d0f1a;
        font-family:Georgia,serif">
        Case Accepted
      </h2>
    </div>
    <div style="padding:30px">
      <p>Good news ${citizenName}!</p>
      <p>Advocate <strong>${lawyerName}</strong>
        has accepted your case:<br>
        <em>${caseTitle}</em>
      </p>
      <p>Open JurisBot to begin your consultation.
      </p>
    </div>
  </div>`
})

const hearingReminderTemplate = (
  citizenName, caseTitle, hearingDate, courtLocation
) => ({
  subject: "JurisBot — Hearing Reminder for Tomorrow",
  html: `<div style="${BASE_STYLE}">
    <div style="background:#f59e0b;padding:20px 30px">
      <h2 style="margin:0;color:#0d0f1a;
        font-family:Georgia,serif">
        Hearing Reminder
      </h2>
    </div>
    <div style="padding:30px">
      <p>Dear ${citizenName},</p>
      <p>Your hearing is scheduled for tomorrow:</p>
      <div style="background:#1e293b;
        border-radius:8px;padding:16px;
        margin:16px 0">
        <p><strong>Case:</strong> ${caseTitle}</p>
        <p><strong>Date:</strong> ${hearingDate}</p>
        <p><strong>Court:</strong>
          ${courtLocation}</p>
      </div>
      <p style="color:#94a3b8;font-size:0.85rem">
        Please carry all relevant documents.
      </p>
    </div>
  </div>`
})

const subscriptionConfirmTemplate = (
  lawyerName, tier, expiresAt
) => ({
  subject: "JurisBot — Subscription Activated",
  html: `<div style="${BASE_STYLE}">
    <div style="background:${GOLD};padding:20px 30px">
      <h2 style="margin:0;color:#0d0f1a;
        font-family:Georgia,serif">
        ${tier} Plan Activated
      </h2>
    </div>
    <div style="padding:30px">
      <p>Welcome to ${tier}, ${lawyerName}!</p>
      <p>Your subscription is active until:
        <strong>${new Date(expiresAt)
          .toLocaleDateString("en-IN")}</strong>
      </p>
      <a href="https://jurisbot.in"
        style="display:inline-block;
        background:${GOLD};color:#0d0f1a;
        padding:12px 24px;border-radius:8px;
        font-weight:700;text-decoration:none;
        margin-top:16px">
        Start Accepting Cases
      </a>
    </div>
  </div>`
})

module.exports = {
  sendEmail,
  otpTemplate,
  lawyerApprovedTemplate,
  lawyerRejectedTemplate,
  caseAssignedTemplate,
  hearingReminderTemplate,
  subscriptionConfirmTemplate
}
