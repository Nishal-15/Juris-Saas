import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/AuthPage';

test.describe('Visual Regression Testing', () => {
  
  test('Citizen Portal Homepage layout should match baseline', async ({ page }) => {
    // Navigate to the homepage
    await page.goto(process.env.CITIZEN_URL || 'https://juris-saas.pages.dev');
    
    // Wait for the main elements to load to avoid flakiness (e.g. fonts, hero image)
    await page.waitForLoadState('networkidle');
    
    // Compare the screenshot against the stored baseline image
    // If the layout shifts by even a few pixels, this test will fail.
    await expect(page).toHaveScreenshot('citizen-homepage-baseline.png', {
      maxDiffPixelRatio: 0.05, // Allow 5% variance for rendering differences
    });
  });

  test('Lawyer Portal Login page layout should match baseline', async ({ page }) => {
    const authPage = new AuthPage(page);
    await authPage.navigate('lawyer');
    
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('lawyer-login-baseline.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
