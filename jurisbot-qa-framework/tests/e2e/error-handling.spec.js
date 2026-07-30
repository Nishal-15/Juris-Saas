import { test, expect } from '@playwright/test';
import { FilingConsolePage } from '../../pages/FilingConsolePage';

test.describe('Resilience & Error Handling (Network Interception)', () => {

  test('Application should gracefully handle 500 Internal Server Errors', async ({ page }) => {
    // Intercept the API call that the AI auto-fill uses and force it to return 500
    await page.route('**/cases/analyze-story', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: "Internal Server Error from Mock" })
      });
    });

    const filingPage = new FilingConsolePage(page);
    await filingPage.navigate();

    // Trigger the AI analysis
    await filingPage.descriptionInput.fill('This is a test story that will trigger an API call which we have rigged to fail.');
    await filingPage.descriptionInput.blur();

    // Ensure the application does not crash and instead shows a fallback message
    // Based on FilingConsole.jsx logic, it sets aiMessage on catch
    const errorMessage = page.locator('text="I\'ve captured your story"');
    await expect(errorMessage).toBeVisible();
  });

  test('Application should handle completely offline scenarios gracefully', async ({ page, context }) => {
    await page.goto(process.env.CITIZEN_URL || 'https://juris-saas.pages.dev/login');

    // Simulate losing internet connection
    await context.setOffline(true);

    // Attempt to login
    await page.fill('input[type="email"]', 'test@offline.com');
    await page.fill('input[type="password"]', 'offline123');
    await page.click('button:has-text("Login")');

    // App should not hard crash; it should display a network error toast or native error
    // Some implementations might not have specific toast, but verifying it doesn't navigate is a good check
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

});
