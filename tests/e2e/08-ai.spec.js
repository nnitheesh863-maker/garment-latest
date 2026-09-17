import { test, expect } from '@playwright/test';

test.describe('08 - AI & ML Predictive Pipeline Suite', () => {
  test('Backend ML Health endpoint reports system status', async ({ request }) => {
    const res = await request.get('http://localhost:5000/api/ai/ml-health');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBeDefined();
    expect(['available', 'unavailable', 'local-ml', 'cloud-fallback']).toContain(data.status);
  });
});
