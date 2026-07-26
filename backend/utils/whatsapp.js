const WA_BASE =
  "https://graph.facebook.com/v18.0"

const sendTemplate = async ({
  to, templateName, languageCode = "en_IN",
  components = []
}) => {
  const PHONE_ID =
    process.env.WHATSAPP_PHONE_NUMBER_ID
  const TOKEN =
    process.env.WHATSAPP_BUSINESS_TOKEN

  if (!PHONE_ID || !TOKEN) {
    console.log(
      `[WhatsApp Simulation] ` +
      `Template: ${templateName} → ${to}`
    )
    return
  }

  const phone = to.startsWith("+")
    ? to.replace("+","")
    : `91${to}`

  try {
    const res = await fetch(
      `${WA_BASE}/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components
          }
        })
      }
    )
    const data = await res.json()
    console.log(`✅ [WhatsApp] ${templateName}
      → ${to}`)
    return data
  } catch (err) {
    console.error(
      `❌ [WhatsApp] ${templateName} failed:`,
      err
    )
  }
}

const getMetaLangCode = (lang = "en") => {
  const map = {
    hi: "hi", bn: "bn", te: "te", mr: "mr", ta: "ta",
    gu: "gu", kn: "kn", ml: "ml", pa: "pa", or: "or",
    ur: "ur", as: "as", en: "en_IN"
  };
  return map[lang] || "en_IN";
};

const sendHearingReminder = ({
  to, citizenName, caseTitle,
  hearingDate, courtLocation,
  lang = "en"
}) => sendTemplate({
  to,
  templateName: "hearing_reminder",
  languageCode: getMetaLangCode(lang),
  components: [{
    type: "body",
    parameters: [
      { type: "text", text: citizenName    },
      { type: "text", text: caseTitle      },
      { type: "text", text: hearingDate    },
      { type: "text", text: courtLocation  }
    ]
  }]
})

const sendCaseAssigned = ({
  to, citizenName, lawyerName, lang = "en"
}) => sendTemplate({
  to,
  templateName: "case_assigned",
  languageCode: getMetaLangCode(lang),
  components: [{
    type: "body",
    parameters: [
      { type: "text", text: citizenName },
      { type: "text", text: lawyerName  }
    ]
  }]
})

const sendLawyerVerified = ({
  to, lawyerName, lang = "en"
}) => sendTemplate({
  to,
  templateName: "lawyer_verified",
  languageCode: getMetaLangCode(lang),
  components: [{
    type: "body",
    parameters: [
      { type: "text", text: lawyerName }
    ]
  }]
})

const sendOTP = ({ to, otp, lang = "en" }) =>
  sendTemplate({
    to,
    templateName: "jurisbot_otp",
    languageCode: getMetaLangCode(lang),
    components: [{
      type: "body",
      parameters: [
        { type: "text", text: otp }
      ]
    }]
  })

const sendMediationAlert = ({
  to, citizenName, caseTitle, lang = "en"
}) => sendTemplate({
  to,
  templateName: "mediation_eligible",
  languageCode: getMetaLangCode(lang),
  components: [{
    type: "body",
    parameters: [
      { type: "text", text: citizenName },
      { type: "text", text: caseTitle   }
    ]
  }]
})

const sendCallInvite = ({
  to, lawyerName, callLink, lang = "en"
}) => sendTemplate({
  to,
  templateName: "consultation_call",
  languageCode: getMetaLangCode(lang),
  components: [{
    type: "body",
    parameters: [
      { type: "text", text: lawyerName },
      { type: "text", text: callLink   }
    ]
  }]
})

module.exports = {
  sendHearingReminder,
  sendCaseAssigned,
  sendLawyerVerified,
  sendOTP,
  sendMediationAlert,
  sendCallInvite
}
