const axios = require("axios");
const fs = require("fs");

const API_URL = "http://localhost:5000/api";

async function runAudit() {
  const log = [];
  log.push("🔍 JURISBOT: STARTING FULL MARKETPLACE AUDIT...");

  try {
    const citizenLogin = await axios.post(`${API_URL}/auth/login`, {
      email: "citizen@example.com",
      password: "password123"
    });
    const citizenToken = citizenLogin.data.token;

    const newCase = await axios.post(`${API_URL}/cases`, {
      title: "GST Dispute - FY2026 Audit",
      description: "Need taxation help on audit issues.",
      type: "Taxation Law",
      urgency: "Urgent"
    }, { headers: { "x-auth-token": citizenToken } });
    log.push(`✅ Case Filed: "${newCase.data.title}"`);

    const lawyerLogin = await axios.post(`${API_URL}/auth/login`, {
      email: "meera@jurisbot.com",
      password: "password123"
    });
    const lawyerToken = lawyerLogin.data.token;

    const marketplace = await axios.get(`${API_URL}/cases/open`, {
      headers: { "x-auth-token": lawyerToken }
    });

    const isMatchFound = marketplace.data.some(c => c._id === newCase.data._id);
    if (isMatchFound) {
      log.push("✨ AUDIT SUCCESS: Case IS visible in Meera's Marketplace! ✨");
    } else {
      log.push("🚨 AUDIT FAILED: Case not found for Meera.");
    }

  } catch (err) {
    log.push("❌ AUDIT CRASHED: " + (err.response?.data?.message || err.message));
  }
  fs.writeFileSync('audit_results.txt', log.join("\n"));
}

runAudit();
