import { test, expect } from '@playwright/test';

test.describe('10 - Master E2E Complete 3-Role Workflow Suite', () => {
  test('Complete workflow verification: Admin -> Manager -> Employee live lifecycle', async ({ browser }) => {
    // 1. Admin Context
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await adminPage.goto('http://localhost:3000/login');
    await adminPage.fill('input[type="email"]', 'admin@garment.com');
    await adminPage.fill('input[type="password"]', 'admin123');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await expect(adminPage.locator('body')).toBeVisible();

    // 2. Manager Context
    const managerContext = await browser.newContext();
    const managerPage = await managerContext.newPage();
    await managerPage.goto('http://localhost:3000/login');
    await managerPage.fill('input[type="email"]', 'manager@garment.com');
    await managerPage.fill('input[type="password"]', 'manager123');
    await managerPage.click('button[type="submit"]');
    await managerPage.waitForURL('**/manager/dashboard', { timeout: 15000 });
    await expect(managerPage.locator('body')).toBeVisible();

    // 3. Employee Context
    const employeeContext = await browser.newContext();
    const employeePage = await employeeContext.newPage();
    await employeePage.goto('http://localhost:3000/login');
    await employeePage.fill('input[type="email"]', 'employee@garment.com');
    await employeePage.fill('input[type="password"]', 'employee123');
    await employeePage.click('button[type="submit"]');
    await employeePage.waitForURL('**/employee/dashboard', { timeout: 15000 });
    await expect(employeePage.locator('body')).toBeVisible();

    // Verify Manager Orders page
    await managerPage.goto('http://localhost:3000/manager/orders');
    await managerPage.waitForTimeout(1500);
    await expect(managerPage.locator('body')).toContainText(/Orders|Garment|Quantity/i);

    // Verify Manager Tasks page
    await managerPage.goto('http://localhost:3000/manager/tasks');
    await managerPage.waitForTimeout(1500);
    await expect(managerPage.locator('body')).toContainText(/Tasks|Assigned|Priority/i);

    // Cleanup contexts
    await adminContext.close();
    await managerContext.close();
    await employeeContext.close();
  });
});
