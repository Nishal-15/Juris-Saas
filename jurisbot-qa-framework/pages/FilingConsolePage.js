export class FilingConsolePage {
  constructor(page) {
    this.page = page;
    this.descriptionInput = page.locator('textarea[placeholder*="Describe what happened"]');
    this.categorySelect = page.locator('select').first(); // Adjust selector based on actual DOM
    this.dateInput = page.locator('input[type="date"]');
    this.nextButton = page.locator('button:has-text("Next")');
    this.submitButton = page.locator('button:has-text("Submit Case")');
    this.successMessage = page.locator('text="Case filed successfully"');
    this.urgencySelect = page.locator('select:has-text("Urgency")'); // Target the urgency select
  }

  async navigate() {
    await this.page.goto(`${process.env.CITIZEN_URL}/file-case`);
  }

  async fillInitialDetails(description, date) {
    await this.descriptionInput.fill(description);
    await this.dateInput.fill(date);
    await this.nextButton.click();
  }

  async selectCategory(category) {
    await this.categorySelect.selectOption({ label: category });
  }

  async selectUrgency(urgencyLevel) {
    await this.urgencySelect.selectOption({ value: urgencyLevel });
  }

  async submitCase() {
    await this.submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async isCaseSubmittedSuccessfully() {
    return await this.successMessage.isVisible();
  }
}
