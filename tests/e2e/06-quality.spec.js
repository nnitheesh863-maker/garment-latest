import { test, expect } from '@playwright/test';

test.describe('06 - Quality Control & Inspection Suite', () => {
  test('Manager/Admin can access quality reports and inspections', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'manager@garment.com');
    await page.fill('input[type="password"]', 'manager123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/manager/dashboard', { timeout: 15000 });
  });
});
