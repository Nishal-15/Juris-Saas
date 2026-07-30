import { test, expect } from '@playwright/test';
import { AuthPage } from '../../../pages/AuthPage';
import { FilingConsolePage } from '../../../pages/FilingConsolePage';

test.describe('Citizen Portal - Case Filing & Dynamic Forms', () => {

  test.beforeEach(async ({ page }) => {
    // Optional: Setup a logged-in state or mock the JWT token if bypassing login
    const authPage = new AuthPage(page);
    await authPage.navigate('citizen');
    
    // In a real scenario, use test environment credentials or mock API
    // await authPage.login(process.env.TEST_USER_EMAIL, process.env.TEST_USER_PASSWORD);
  });

  test('Should validate required fields before submission', async ({ page }) => {
    const filingPage = new FilingConsolePage(page);
    // Directly navigating to filing assuming session exists or auth is mocked in a fixture
    await filingPage.navigate();
    
    // Attempting to submit without filling details
    if(await filingPage.nextButton.isVisible()) {
      await filingPage.nextButton.click();
    }
    
    // Check for HTML5 validation or custom UI error
    // (This depends on JurisBot's specific implementation, looking for generic required states)
    const descriptionError = page.locator(':text("Description is required"), :text("Please fill out this field")').first();
    const isErrorVisible = await descriptionError.isVisible() || await filingPage.descriptionInput.evaluate(node => node.validity.valueMissing);
    
    expect(isErrorVisible).toBeTruthy();
  });

  test('Should map AI Legal Type correctly when typing tax-related dispute', async ({ page }) => {
    // This tests the newly fixed AI Triage logic End-to-End
    const filingPage = new FilingConsolePage(page);
    await filingPage.navigate();

    await filingPage.descriptionInput.fill('I want to appeal against a GST penalty order issued by the customs department for my tax evasion case.');
    
    // Trigger AI AutoFill by blur or clicking next
    await filingPage.descriptionInput.blur();
    
    // Wait for the backend /analyze-story to respond
    await page.waitForResponse(response => response.url().includes('/analyze-story') && response.status() === 200);

    // Assert that the dropdown auto-selected 'Tax Law' (from our previous fix)
    const selectedCategory = await filingPage.categorySelect.inputValue();
    expect(selectedCategory).toContain('Tax Law');
  });

});
