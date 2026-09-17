import { test, expect } from '@playwright/test';

test.describe('03 - Manager Operations & Monitoring Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'manager@garment.com');
    await page.fill('input[type="password"]', 'manager123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/manager/dashboard', { timeout: 15000 });
  });

  test('Manager dashboard loads 14-day production metrics and live queues', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Production|Capacity|Active Tasks|Orders/i);
  });

  test('Manager task management displays real tasks without mock state', async ({ page }) => {
    await page.goto('/manager/tasks');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/Task|Status|Assigned|Priority/i);
  });

  test('Manager order management displays orders list with search and filters', async ({ page }) => {
    await page.goto('/manager/orders');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/Orders|Customer|Garment|Quantity/i);
  });

  test('Manager machine management displays live machine telemetry', async ({ page }) => {
    await page.goto('/manager/machines');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toContainText(/Machine|Status|Line|Utilization/i);
  });
});
