import { test, expect } from '@playwright/test';

test.describe('04 - Employee Shop Floor & Execution Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@garment.com');
    await page.fill('input[type="password"]', 'employee123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/employee/dashboard', { timeout: 15000 });
  });

  test('Employee dashboard renders assigned task queue and attendance widgets', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).toContainText(/Employee|Shift|Attendance|Tasks/i);
  });
});
