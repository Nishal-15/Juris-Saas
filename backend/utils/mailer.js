let google = null;
try {
  google = require("googleapis").google;
} catch {
  /* googleapis not installed */
}

const { Resend } = require("resend");
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const createTransporter = async () => {
  if (!google) throw new Error("googleapis module not installed");
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
  const from = process.env.GMAIL_SENDER_ADDRESS || process.env.EMAIL_USER ||
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
    const auth = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
    if (
      !google ||
      ((!process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_REFRESH_TOKEN) && !auth.user)
    ) {
      if (resend) {
        await resend.emails.send({
          from: "JurisBot Notifications <onboarding@resend.dev>",
          to,
          subject,
          html
        });
        console.log(`✅ [Resend] Sent to ${to}`);
        return;
      }
      console.log(
        `[Email Simulation] To: ${to} | ` +
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

const citizenWelcomeTemplate = (userName) => ({
  subject: "Welcome to JurisBot — Your 24/7 AI Legal Companion",
  html: `<div style="${BASE_STYLE}">
    <div style="background:${GOLD};padding:24px 30px">
      <h2 style="margin:0;color:#0d0f1a;font-family:Georgia,serif">Welcome to JurisBot</h2>
    </div>
    <div style="padding:30px">
      <p>Dear ${userName || "Citizen"},</p>
      <p>Welcome to <strong>JurisBot</strong>! You now have access to India's premier AI legal guidance and advocate consultation platform.</p>
      <div style="background:#1e293b;border-radius:12px;padding:18px;margin:20px 0;border:1px solid rgba(255,255,255,0.1)">
        <h4 style="margin:0 0 10px 0;color:${GOLD}">What You Can Do Now:</h4>
        <ul style="margin:0;padding-left:20px;color:#cbd5e1;line-height:1.6">
          <li>💬 <strong>AI Legal Triage:</strong> Ask any legal question 24/7 in English or regional languages.</li>
          <li>⚖️ <strong>File a Case:</strong> Connect with verified Supreme Court, High Court & District Court advocates.</li>
          <li>🤝 <strong>Mediation & Arbitration:</strong> Settle disputes amicably without lengthy court proceedings.</li>
        </ul>
      </div>
      <a href="https://jurisbot.in" style="display:inline-block;background:${GOLD};color:#0d0f1a;padding:12px 26px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:10px">Open Citizen Portal</a>
    </div>
  </div>`
});

const lawyerWelcomeTemplate = (lawyerName) => ({
  subject: "Welcome to JurisBot PRO — India's Elite Legal Network",
  html: `<div style="${BASE_STYLE}">
    <div style="background:linear-gradient(135deg, #c9a84c 0%, #a6852e 100%);padding:24px 30px">
      <h2 style="margin:0;color:#0d0f1a;font-family:Georgia,serif">Welcome to JurisBot PRO</h2>
    </div>
    <div style="padding:30px">
      <p>Dear Advocate ${lawyerName || "Practitioner"},</p>
      <p>Welcome to <strong>JurisBot PRO</strong>. Your practitioner registration has been received and institutional Bar Council credential verification is in progress.</p>
      <div style="background:#1e293b;border-radius:12px;padding:18px;margin:20px 0;border:1px solid rgba(255,255,255,0.1)">
        <h4 style="margin:0 0 10px 0;color:${GOLD}">Next Steps for Advocates:</h4>
        <ul style="margin:0;padding-left:20px;color:#cbd5e1;line-height:1.6">
          <li>🛡️ <strong>AI Credential Check:</strong> Our AI verifies your enrollment certificate automatically in real-time.</li>
          <li>🏛️ <strong>Live Marketplace:</strong> Receive client case requests and consultation appointments directly.</li>
          <li>📄 <strong>AI Legal Drafter & Analyzer:</strong> Draft petitions, legal notices, and analyze case documents in seconds.</li>
        </ul>
      </div>
      <a href="https://jurisbot.in/lawyer/dashboard" style="display:inline-block;background:${GOLD};color:#0d0f1a;padding:12px 26px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:10px">Access Practitioner Console</a>
    </div>
  </div>`
});

const passwordResetTemplate = (resetLink, userName) => ({
  subject: "JurisBot — Password Reset Request",
  html: `<div style="${BASE_STYLE}">
    <div style="background:#ef4444;padding:20px 30px">
      <h2 style="margin:0;color:white;font-family:Georgia,serif">Password Reset</h2>
    </div>
    <div style="padding:30px">
      <p>Hello ${userName || "User"},</p>
      <p>We received a request to reset your password for your JurisBot account. Click the button below to set a new password:</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${resetLink}" style="display:inline-block;background:${GOLD};color:#0d0f1a;padding:14px 28px;border-radius:10px;font-weight:800;text-decoration:none;font-size:1rem">Reset Password Now</a>
      </div>
      <p style="color:#94a3b8;font-size:0.85rem;word-break:break-all">
        Or paste this link into your browser:<br>${resetLink}<br><br>
        This link is valid for 15 minutes. If you did not request a password reset, please ignore this email.
      </p>
    </div>
  </div>`
});

const caseFiledCitizenTemplate = (userName, caseTitle, caseId, urgencyClass = "Standard") => {
  const isEmergency = String(urgencyClass).toUpperCase() === "EMERGENCY";
  const isUrgent = String(urgencyClass).toUpperCase() === "URGENT";
  const badgeColor = isEmergency ? "#ef4444" : isUrgent ? "#f59e0b" : "#10b981";
  const badgeText = isEmergency ? "🚨 EMERGENCY LEGAL ACTION" : isUrgent ? "⚠️ URGENT PRIORITY" : "🟢 STANDARD TRACK";

  return {
    subject: `JurisBot — Case Filed Successfully [ID: #${String(caseId).slice(-6).toUpperCase()}]`,
    html: `<div style="${BASE_STYLE}">
      <div style="background:${GOLD};padding:24px 30px">
        <h2 style="margin:0;color:#0d0f1a;font-family:Georgia,serif">Case Filing Confirmation</h2>
      </div>
      <div style="padding:30px">
        <p>Dear ${userName || "Citizen"},</p>
        <p>Your legal case has been successfully filed and indexed into the JurisBot marketplace for matching with verified advocates.</p>
        
        <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0;border:1px solid rgba(255,255,255,0.15)">
          <div style="margin-bottom:12px">
            <span style="background:${badgeColor};color:white;padding:5px 12px;border-radius:20px;font-size:0.75rem;font-weight:800;letter-spacing:1px">${badgeText}</span>
          </div>
          <p style="margin:0 0 8px 0;color:#94a3b8;font-size:0.85rem">CASE TITLE</p>
          <h3 style="margin:0 0 16px 0;color:white;font-size:1.15rem">${caseTitle}</h3>
          <p style="margin:0 0 4px 0;color:#94a3b8;font-size:0.85rem">CASE REFERENCE NUMBER</p>
          <strong style="color:${GOLD};font-size:1.05rem">#${String(caseId).slice(-6).toUpperCase()}</strong>
        </div>

        <p style="color:#cbd5e1;font-size:0.9rem">
          ${isEmergency || isUrgent ? "Because your case is classified as <strong>high priority</strong>, verified advocates have been notified immediately." : "Verified advocates in your jurisdiction are reviewing your case filing."}
        </p>
        <a href="https://jurisbot.in" style="display:inline-block;background:${GOLD};color:#0d0f1a;padding:12px 26px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:14px">Track Case Status</a>
      </div>
    </div>`
  };
};

const caseFiledLawyerNotificationTemplate = (lawyerName, clientName, caseTitle, urgencyClass = "Standard", caseId) => {
  const isEmergency = String(urgencyClass).toUpperCase() === "EMERGENCY";
  const isUrgent = String(urgencyClass).toUpperCase() === "URGENT";
  const badgeColor = isEmergency ? "#ef4444" : isUrgent ? "#f59e0b" : "#3b82f6";
  const badgeText = isEmergency ? "🚨 EMERGENCY CASE FILED" : isUrgent ? "⚠️ URGENT CASE FILED" : "🏛️ NEW CLIENT CASE FILED";

  return {
    subject: `[${badgeText}] New Client Case in Your Jurisdiction: ${String(caseTitle).slice(0, 40)}...`,
    html: `<div style="${BASE_STYLE}">
      <div style="background:${isEmergency ? '#ef4444' : isUrgent ? '#f59e0b' : GOLD};padding:24px 30px">
        <h2 style="margin:0;color:${isEmergency || isUrgent ? 'white' : '#0d0f1a'};font-family:Georgia,serif">${badgeText}</h2>
      </div>
      <div style="padding:30px">
        <p>Dear Advocate ${lawyerName || "Practitioner"},</p>
        <p>A new client case requiring representation has just been filed by <strong>${clientName}</strong> and matches your legal jurisdiction and specialization.</p>
        
        <div style="background:#1e293b;border-radius:12px;padding:20px;margin:20px 0;border:1px solid rgba(255,255,255,0.15)">
          <div style="margin-bottom:12px">
            <span style="background:${badgeColor};color:white;padding:5px 12px;border-radius:20px;font-size:0.75rem;font-weight:800;letter-spacing:1px">${badgeText}</span>
          </div>
          <p style="margin:0 0 6px 0;color:#94a3b8;font-size:0.85rem">CASE TITLE / SUMMARY</p>
          <h3 style="margin:0 0 16px 0;color:white;font-size:1.1rem">${caseTitle}</h3>
          <p style="margin:0 0 4px 0;color:#94a3b8;font-size:0.85rem">CLIENT / FILER</p>
          <strong style="color:white;font-size:1rem">${clientName}</strong>
        </div>

        <p style="color:#cbd5e1;font-size:0.9rem">
          ${isEmergency || isUrgent ? "⚡ <strong>Urgent action recommended:</strong> This case is flagged for immediate legal intervention. Claim it before another practitioner accepts it." : "Log in to your Practitioner Workspace to review the case documents and claim representation."}
        </p>
        <a href="https://jurisbot.in/lawyer/dashboard" style="display:inline-block;background:${GOLD};color:#0d0f1a;padding:14px 28px;border-radius:10px;font-weight:800;text-decoration:none;margin-top:14px">Review & Claim Case #${String(caseId).slice(-6).toUpperCase()}</a>
      </div>
    </div>`
  };
};

module.exports = {
  sendEmail,
  otpTemplate,
  lawyerApprovedTemplate,
  lawyerRejectedTemplate,
  caseAssignedTemplate,
  hearingReminderTemplate,
  subscriptionConfirmTemplate,
  citizenWelcomeTemplate,
  lawyerWelcomeTemplate,
  passwordResetTemplate,
  caseFiledCitizenTemplate,
  caseFiledLawyerNotificationTemplate
}
