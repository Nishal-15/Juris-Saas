import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility (A11y) Testing', () => {

  test('Citizen Portal should meet WCAG accessibility standards', async ({ page }) => {
    await page.goto(process.env.CITIZEN_URL || 'https://juris-saas.pages.dev');
    
    // Inject the axe-core script into the page
    await injectAxe(page);
    
    // Scan the entire page for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('Filing Console should have proper ARIA labels and contrast', async ({ page }) => {
    // Navigate directly to filing console (assuming mock auth or unprotected route for this test)
    await page.goto(`${process.env.CITIZEN_URL || 'https://juris-saas.pages.dev'}/file-case`);
    
    await injectAxe(page);
    
    // We can exclude specific known third-party violations if needed
    // Example: { exclude: [['.third-party-widget']] }
    await checkA11y(page, null, {
      axeOptions: {
        rules: {
          'color-contrast': { enabled: true },
          'aria-roles': { enabled: true },
        },
      },
    });
  });
});
