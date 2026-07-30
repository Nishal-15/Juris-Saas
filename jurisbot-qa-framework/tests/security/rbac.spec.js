import { test, expect } from '@playwright/test';

test.describe('Role-Based Access Control (RBAC) Validation', () => {

  const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:5000/api';

  // These tokens should be dynamically retrieved in a global setup in a real scenario
  const citizenToken = process.env.MOCK_CITIZEN_TOKEN || 'mock_citizen';
  const lawyerToken = process.env.MOCK_LAWYER_TOKEN || 'mock_lawyer';
  
  test('Citizen absolutely cannot access Lawyer Admin endpoints', async ({ request }) => {
    // Attempting to hit an endpoint protected by auth(['lawyer', 'admin'])
    const response = await request.get(`${backendUrl}/admin/cases`, {
      headers: {
        'Authorization': `Bearer ${citizenToken}`
      }
    });

    // Should return 401 Unauthorized or 403 Forbidden
    expect([401, 403]).toContain(response.status());
  });

  test('Lawyer cannot impersonate Admin to update case statuses', async ({ request }) => {
    const testCaseId = '1234567890abcdef12345678';
    // Attempting to hit the admin case status update endpoint as a lawyer
    const response = await request.put(`${backendUrl}/admin/cases/${testCaseId}/status`, {
      headers: {
        'Authorization': `Bearer ${lawyerToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        status: "Mediation Active"
      }
    });

    // The route auth(["admin"]) must reject this
    expect([401, 403]).toContain(response.status());
  });

  test('Unauthenticated user cannot access Document Vault APIs', async ({ request }) => {
    const response = await request.get(`${backendUrl}/documents/vault`);
    
    // Completely unauthenticated request must fail immediately
    expect(response.status()).toBe(401);
  });
});
