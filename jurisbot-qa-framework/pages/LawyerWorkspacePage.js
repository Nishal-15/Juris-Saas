export class LawyerWorkspacePage {
  constructor(page) {
    this.page = page;
    this.caseList = page.locator('.case-list, .case-card');
    this.aiDrafterTab = page.locator('a:has-text("AI Drafter"), button:has-text("Draft")');
    this.draftInput = page.locator('textarea[placeholder*="facts"], textarea[placeholder*="draft"]');
    this.generateDraftButton = page.locator('button:has-text("Generate Draft"), .generate-btn');
    this.draftResult = page.locator('.draft-result, .ai-output');
    this.clientManagementTab = page.locator('a:has-text("Clients"), button:has-text("Clients")');
    this.reportsTab = page.locator('a:has-text("Reports")');
  }

  async navigate() {
    await this.page.goto(`${process.env.LAWYER_URL}/workspace`);
  }

  async navigateToAIDrafter() {
    await this.aiDrafterTab.click();
    await this.page.waitForLoadState('networkidle');
  }

  async generateLegalDraft(facts) {
    await this.draftInput.fill(facts);
    await this.generateDraftButton.click();
  }

  async waitForDraftCompletion() {
    await this.page.waitForLoadState('networkidle');
    await this.draftResult.waitFor({ state: 'visible', timeout: 45000 });
  }

  async getDraftText() {
    return await this.draftResult.textContent();
  }
}
