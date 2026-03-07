import { test, expect } from '../helpers';

/**
 * AUTHENTICATION TESTS
 * Testing registration, login, logout, password reset
 */

test.describe('Authentication Flow', () => {
    const getTestUser = (suffix = '') => {
        const timestamp = Date.now() + Math.floor(Math.random() * 1000);
        return {
            email: `test_auth_${timestamp}${suffix}@example.com`,
            password: 'SecurePass123!',
            first_name: 'Auth',
            last_name: 'Test'
        };
    };

    const sharedUser = getTestUser('shared');

    test('01 - User Registration Success', async ({ page }) => {
        const testUser = getTestUser();
        await page.goto('/register');

        // Fill form
        await page.fill('input[name="email"]', testUser.email);
        await page.fill('input[name="password"]', testUser.password);
        await page.fill('input[name="password_confirm"]', testUser.password);
        await page.fill('input[name="first_name"]', testUser.first_name);
        await page.fill('input[name="last_name"]', testUser.last_name);

        // Submit
        await page.click('button[type="submit"]');

        // Should redirect to home
        await expect(page).toHaveURL('/', { timeout: 10000 });

        // Should show user menu or profile link
        await expect(page.locator('a[href="/dashboard"], a[href="/profile"]').first()).toBeVisible({ timeout: 10000 });
    });

    test('02 - Registration with Existing Email Fails', async ({ page }) => {
        // First register a user
        await page.goto('/register');
        await page.fill('input[name="email"]', sharedUser.email);
        await page.fill('input[name="password"]', sharedUser.password);
        await page.fill('input[name="password_confirm"]', sharedUser.password);
        await page.fill('input[name="first_name"]', sharedUser.first_name);
        await page.fill('input[name="last_name"]', sharedUser.last_name);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
        await page.goto('/logout');
        await page.waitForTimeout(1000);

        await page.goto('/register');

        // Try to register with same email
        await page.fill('input[name="email"]', sharedUser.email);
        await page.fill('input[name="password"]', 'AnotherPass123!');
        await page.fill('input[name="password_confirm"]', 'AnotherPass123!');
        await page.fill('input[name="first_name"]', 'Duplicate');
        await page.fill('input[name="last_name"]', 'User');

        await page.click('button[type="submit"]');

        // Should show error
        const error = page.locator('text=/already exists|уже существует|error/i').first();
        await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('03 - Login Success', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[name="email"]', sharedUser.email);
        await page.fill('input[name="password"]', sharedUser.password);
        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/', { timeout: 10000 });

        const userIndicator = page.locator('a[href="/dashboard"], a[href="/profile"]').first();
        await expect(userIndicator).toBeVisible({ timeout: 10000 });
    });

    test('04 - Login with Wrong Password Fails', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[name="email"]', sharedUser.email);
        await page.fill('input[name="password"]', 'WrongPassword123!');
        await page.click('button[type="submit"]');

        // Should show error
        const error = page.locator('text=/Invalid|Неверный|credentials|пароль/i').first();
        await expect(error).toBeVisible({ timeout: 5000 });
    });

    test('05 - Logout Success', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[name="email"]', sharedUser.email);
        await page.fill('input[name="password"]', sharedUser.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        // Logout
        await page.locator('button[aria-label="Logout"], .lucide-log-out').first().click();
        await page.waitForURL('/', { timeout: 10000 });

        // Should redirect to home or login
        await expect(page).toHaveURL(/\/(login)?$/, { timeout: 10000 });

        // User menu should not be visible
        await expect(page.locator('a[href="/profile"]').first()).not.toBeVisible();
    });

    test('06 - Protected Route Redirects to Login', async ({ page }) => {
        // Try to access dashboard without login
        await page.goto('/dashboard');

        // Should redirect to login
        await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
    });

    test('07 - Token Persistence After Refresh', async ({ page }) => {
        // Ensure we are logged out
        await page.goto('/');
        const logoutBtn = page.locator('button[aria-label="Logout"], .lucide-log-out').first();
        if (await logoutBtn.isVisible()) {
            await logoutBtn.click();
            await page.waitForURL('/');
        }

        // Login
        await page.goto('/login');
        await page.fill('input[name="email"]', sharedUser.email);
        await page.fill('input[name="password"]', sharedUser.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('/', { timeout: 15000 });

        // Refresh page
        await page.reload();

        // User should still be logged in
        const userIndicator = page.locator('a[href="/dashboard"], a[href="/profile"]').first();
        await expect(userIndicator).toBeVisible({ timeout: 10000 });
    });
});
