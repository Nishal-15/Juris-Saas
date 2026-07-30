import { test, expect } from '@playwright/test';
import { AuthPage } from '../../../pages/AuthPage';
import { LawyerWorkspacePage } from '../../../pages/LawyerWorkspacePage';

test.describe('Lawyer Portal - Workspace & AI Drafter', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate and authenticate as a Lawyer
    const authPage = new AuthPage(page);
    await authPage.navigate('lawyer');
    // await authPage.login(process.env.LAWYER_EMAIL, process.env.LAWYER_PASSWORD);
  });

  test('Should navigate to AI Drafter and generate a legal draft successfully', async ({ page }) => {
    const workspacePage = new LawyerWorkspacePage(page);
    await workspacePage.navigate();

    // Verify AI Drafter is accessible
    await workspacePage.navigateToAIDrafter();
    
    // Provide facts to the AI
    const testFacts = "Client was terminated from their job as a software engineer on July 10th without notice pay or valid reason. Total dues unpaid amount to 2 lakhs.";
    await workspacePage.generateLegalDraft(testFacts);

    // Wait for AI to stream response
    await workspacePage.waitForDraftCompletion();
    
    // Validate that a draft was actually produced and contains legal terminology
    const draftText = await workspacePage.getDraftText();
    
    expect(draftText.length).toBeGreaterThan(100);
    expect(draftText.toLowerCase()).toContain('client');
    expect(draftText.toLowerCase()).toContain('notice');
    // Ensure it didn't just return an empty or error state
    expect(draftText.toLowerCase()).not.toContain('error generating draft');
  });

  test('Should load assigned cases in the workspace', async ({ page }) => {
    const workspacePage = new LawyerWorkspacePage(page);
    await workspacePage.navigate();
    
    // Expect the case list to eventually load at least one element or an empty state UI
    const caseCards = workspacePage.caseList;
    await expect(caseCards.first()).toBeVisible({ timeout: 15000 });
  });

});
