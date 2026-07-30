export class DocumentVaultPage {
  constructor(page) {
    this.page = page;
    this.uploadInput = page.locator('input[type="file"]');
    this.uploadButton = page.locator('button:has-text("Upload"), .upload-btn');
    this.documentList = page.locator('.document-list, .file-item');
    this.errorMessage = page.locator('.error-toast, .error-message, text="Invalid file"');
  }

  async navigate() {
    await this.page.goto(`${process.env.CITIZEN_URL}/vault`); // Adjust URL as necessary
  }

  async uploadFile(filePath) {
    await this.uploadInput.setInputFiles(filePath);
    if (await this.uploadButton.isVisible()) {
      await this.uploadButton.click();
    }
    await this.page.waitForLoadState('networkidle');
  }

  async getUploadedDocumentNames() {
    return await this.documentList.allTextContents();
  }

  async getErrorMessage() {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent();
  }
}
