export class AuthPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"], input[name="email"]');
    this.passwordInput = page.locator('input[type="password"], input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]:has-text("Login"), button:has-text("Sign In")');
    this.registerLink = page.locator('a:has-text("Register"), a:has-text("Sign Up")');
    this.errorMessage = page.locator('.error-message, [role="alert"]');
  }

  async navigate(portal = 'citizen') {
    const url = portal === 'lawyer' ? process.env.LAWYER_URL : process.env.CITIZEN_URL;
    await this.page.goto(`${url}/login`);
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
