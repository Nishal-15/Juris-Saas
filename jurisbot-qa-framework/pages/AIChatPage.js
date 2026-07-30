export class AIChatPage {
  constructor(page) {
    this.page = page;
    this.chatInput = page.locator('textarea[placeholder*="Ask JurisBot"], input[placeholder*="message"]');
    this.sendButton = page.locator('button[type="submit"], button:has-text("Send"), .send-btn');
    this.chatMessages = page.locator('.message, .chat-message, .bot-response');
    this.loadingIndicator = page.locator('.typing-indicator, .loading-dots');
  }

  async navigate() {
    await this.page.goto(`${process.env.CITIZEN_URL}/chat`); // Adjust route based on app
  }

  async sendMessage(message) {
    await this.chatInput.fill(message);
    await this.sendButton.click();
  }

  async waitForAIResponse() {
    // Wait for the loading indicator to appear then disappear, or just wait for network idle
    await this.page.waitForLoadState('networkidle');
    await this.chatMessages.last().waitFor({ state: 'visible', timeout: 30000 });
  }

  async getLastMessageText() {
    const messages = await this.chatMessages.all();
    if (messages.length === 0) return null;
    return await messages[messages.length - 1].textContent();
  }
}
