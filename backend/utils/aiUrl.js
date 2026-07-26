/**
 * Returns the base URL for the AI service
 * without any path suffix.
 *
 * Handles both:
 *   PYTHON_AI_SERVICE_URL=http://127.0.0.1:8088
 *   PYTHON_AI_SERVICE_URL=http://127.0.0.1:8088/chat
 */
const getAIBaseURL = () => {
  const raw =
    process.env.PYTHON_AI_SERVICE_URL ||
    "http://127.0.0.1:8088/chat"
  /* Strip trailing /chat or /chat/ */
  return raw.replace(/\/chat\/?$/, "")
}

const getAIChatURL = () =>
  `${getAIBaseURL()}/chat`

const getAIMediationURL = () =>
  `${getAIBaseURL()}/mediation-video`

const getAIMediationStatusURL = (videoId) =>
  `${getAIBaseURL()}/mediation-video/status/${videoId}`

const getAIDocumentURL = () =>
  `${getAIBaseURL()}/analyze-document`

const getAIDraftURL = () =>
  `${getAIBaseURL()}/draft-document`

module.exports = {
  getAIBaseURL,
  getAIChatURL,
  getAIMediationURL,
  getAIMediationStatusURL,
  getAIDocumentURL,
  getAIDraftURL
}
