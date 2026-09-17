import { test, expect } from '@playwright/test';

test.describe('09 - Enterprise Audit Logging Suite', () => {
  test('Admin can fetch audit logs from live API', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@garment.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });

    await page.goto('/admin/audit-logs');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/Audit Logs|System Activity/i);
  });
});
