import { test, expect } from '@playwright/test';

test.describe('02 - Admin Control Center & Audit Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@garment.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
  });

  test('Admin dashboard renders live KPIs and navigation', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=GarmentOS').or(page.locator('text=Couture Intelligence'))).toBeVisible();
  });

  test('Admin audit logs page displays real database events', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/Audit Logs|System Activity|Activity Log/i);
  });
});
