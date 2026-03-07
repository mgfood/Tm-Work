import { test as base, expect } from '@playwright/test';

/**
 * Test Helpers and Fixtures
 */

export const test = base.extend({
    // Auto-login fixture for authenticated tests
    authenticatedPage: async ({ page }, use) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'TestPass123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
        await use(page);
    },
});

/**
 * Helper Functions
 */

export async function createUser(page, userData) {
    await page.goto('/register');
    await page.fill('input[name="email"]', userData.email);
    await page.fill('input[name="password"]', userData.password);
    await page.fill('input[name="password_confirm"]', userData.password);
    await page.fill('input[name="first_name"]', userData.first_name);
    await page.fill('input[name="last_name"]', userData.last_name);

    // Handle roles (default is ['CLIENT'] in RegisterPage.jsx)
    if (userData.roles) {
        // Toggle Client off if not requested
        if (!userData.roles.includes('CLIENT')) {
            await page.click('button:has-text("Заказчиком"), button:has-text("Client")');
        }
        // Toggle Freelancer on if requested
        if (userData.roles.includes('FREELANCER')) {
            await page.click('button:has-text("Фрилансером"), button:has-text("Freelancer")');
        }
    }

    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 15000 });
}

export async function logout(page) {
    await page.goto('/logout');
    // Wait for redirection to login page (which LogoutPage does)
    await page.waitForURL('/login', { timeout: 10000 });
    // Ensure storage is cleared even if server logout fails
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.waitForLoadState('networkidle');
}

export async function login(page, email, password, expectedInitial) {
    // Always start with a fresh session
    await logout(page);

    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for navigation or error
    try {
        await page.waitForURL(url =>
            ['/', '/dashboard', '/profile', '/admin-dashboard', '/admin'].some(path => url.pathname.startsWith(path)),
            { timeout: 10000 }
        );
    } catch (err) {
        // Check for error message on the page
        const errorMsg = await page.locator('.error, [role="alert"], .text-red-600').first().textContent().catch(() => null);
        if (errorMsg) {
            throw new Error(`Login failed for ${email}: ${errorMsg.trim()}`);
        }
        throw new Error(`Login timeout for ${email} at ${page.url()}. Form may not have submitted or redirected.`);
    }
    await page.waitForLoadState('networkidle');

    // Wait for the tokens to be actually saved and context to update
    await page.waitForFunction(() => localStorage.getItem('access_token') !== null, { timeout: 5000 }).catch(() => { });

    // Verify the user is correct if initial provided
    if (expectedInitial) {
        // Find the profile link (which contains the user's initial)
        const profileLink = page.locator('[data-testid="profile-link"]');
        await expect(profileLink).toContainText(expectedInitial.toUpperCase(), { timeout: 10000 });
    }

    // Add a small delay to let React context fully initialize with the new state
    await page.waitForTimeout(1500);
}

export async function createJob(page, jobData) {
    await page.goto('/jobs/create');

    await page.fill('[data-testid="job-title-input"]', jobData.title);
    await page.fill('[data-testid="job-description-input"]', jobData.description);
    await page.fill('[data-testid="job-budget-input"]', jobData.budget.toString());

    if (jobData.deadline) {
        // datetime-local expects YYYY-MM-DDTHH:mm
        const formattedDeadline = jobData.deadline.includes('T') ? jobData.deadline : `${jobData.deadline}T12:00`;
        await page.fill('[data-testid="job-deadline-input"]', formattedDeadline);
    }

    if (jobData.category) {
        // Wait for categories to load
        await page.waitForSelector('[data-testid="job-category-select"] option:nth-child(2)', { state: 'attached', timeout: 10000 });
        await page.selectOption('[data-testid="job-category-select"]', { index: 1 });
    }

    // Click publish by default in helper
    await page.click('[data-testid="publish-job-button"]');
    await page.waitForTimeout(2000);
}

export async function waitForToast(page, message) {
    const toast = page.locator('.toast, [role="alert"], .notification').filter({ hasText: message });
    await expect(toast).toBeVisible({ timeout: 5000 });
}

export { expect };
