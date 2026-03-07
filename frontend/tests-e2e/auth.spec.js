import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    // We use one test for the full flow to ensure sequential execution and same user data
    test('should complete full auth cycle: register, login, logout', async ({ page }) => {
        const randomEmail = `testuser_${Math.floor(Math.random() * 100000)}@test.com`;
        const password = 'Password123!';

        // 1. REGISTRATION
        await page.goto('/register');
        await page.fill('input[name="first_name"]', 'Test');
        await page.fill('input[name="last_name"]', 'User');
        await page.fill('input[name="email"]', randomEmail);
        await page.fill('input[name="password"]', password);
        await page.fill('input[name="password_confirm"]', password);

        await page.click('button[type="submit"]');

        // After registration, the system usually auto-logs you in or redirects to login
        // In TmWork, it redirects to / (home) with auto-login
        await expect(page).toHaveURL('/', { timeout: 10000 });
        // Use 'header' instead of 'nav' because there are multiple 'nav' elements
        await expect(page.locator('header')).toContainText('TMT');

        // 2. LOGOUT
        // In our Navbar, logout button has aria-label="Logout"
        await page.click('button[aria-label="Logout"]');
        await expect(page).toHaveURL('/');
        // Balance (TMT) should disappear from the header
        await expect(page.locator('header')).not.toContainText('TMT');

        // 3. LOGIN (to verify back-and-forth)
        await page.goto('/login');
        await page.fill('input[type="email"]', randomEmail);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/', { timeout: 10000 });
        await expect(page.locator('header')).toContainText('TMT');
    });
});
