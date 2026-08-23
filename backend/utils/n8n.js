/**
 * Juris → n8n Fire-and-Forget Dispatcher
 *
 * Usage:
 *   const { triggerN8N } = require("../utils/n8n");
 *   triggerN8N("case-assigned", { lawyerPhone, caseTitle, lang });
 *
 * This NEVER throws and NEVER blocks the main request.
 * If n8n is not configured, it silently no-ops.
 */
const axios = require("axios");

const N8N_BASE    = process.env.N8N_WEBHOOK_BASE_URL;
const N8N_API_KEY = process.env.N8N_API_KEY; // optional header auth

/**
 * @param {string} event   - Matches the n8n webhook path e.g. "case-assigned"
 * @param {object} payload - JSON body sent to n8n
 */
async function triggerN8N(event, payload = {}) {
  // Gracefully no-op if n8n is not configured
  if (!N8N_BASE || N8N_BASE.includes("your_") || N8N_BASE.includes("localhost:5678") === false && N8N_BASE.includes("http") === false) {
    return;
  }

  const url = `${N8N_BASE}/${event}`;

  try {
    const headers = { "Content-Type": "application/json" };
    if (N8N_API_KEY) headers["X-N8N-API-KEY"] = N8N_API_KEY;

    await axios.post(url, {
      event,
      timestamp: new Date().toISOString(),
      ...payload
    }, {
      headers,
      timeout: 4000 // Never block the main request for more than 4s
    });

    console.log(`[n8n] ✅ Triggered: ${event}`);
  } catch (err) {
    // Fire-and-forget: log but NEVER throw — main request must not fail
    console.warn(`[n8n] ⚠️  Webhook failed for "${event}": ${err.message}`);
  }
}

module.exports = { triggerN8N };
