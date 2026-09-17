import { test, expect } from '@playwright/test';

test.describe('01 - Authentication & RBAC Test Suite', () => {
  test('Admin login, dashboard access and secure session', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Couture Intelligence|Garment|Smart Factory/i);

    // Fill Admin credentials
    await page.fill('input[type="email"]', 'admin@garment.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to admin dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Admin|Command Center|Overview/i);
  });

  test('Manager login, dashboard access and RBAC protection', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'manager@garment.com');
    await page.fill('input[type="password"]', 'manager123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/manager/dashboard', { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Manager|Production|Operations/i);

    // Attempt to access Admin route directly
    await page.goto('/admin/dashboard');
    // Should redirect away or deny access
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain('/admin/dashboard');
  });

  test('Employee login, shop floor access and RBAC protection', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@garment.com');
    await page.fill('input[type="password"]', 'employee123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/employee/dashboard', { timeout: 15000 });
    await expect(page.locator('body')).toContainText(/Employee|Task|Shop Floor|Production/i);

    // Attempt to access Manager route directly
    await page.goto('/manager/dashboard');
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain('/manager/dashboard');
  });

  test('Invalid credentials display friendly error alert', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@garment.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.MuiAlert-root')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.MuiAlert-root')).toContainText(/invalid|credentials|error|failed/i);
  });
});
