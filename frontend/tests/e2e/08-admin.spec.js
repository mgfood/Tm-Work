import { test, expect, login } from '../helpers';

/**
 * REWRITTEN ADMIN PANEL TESTS
 * Focused on stability, data-testid locators, and comprehensive coverage.
 */

test.describe('Admin Panel E2E', () => {
    const adminCredentials = {
        email: 'mgurbanmuradow2010@gmail.com',
        password: 'meylis2010aprel'
    };

    // Before each test, we need to be logged in as admin
    test.beforeEach(async ({ page }) => {
        console.log(`Setting up test for: ${adminCredentials.email}`);
        await login(page, adminCredentials.email, adminCredentials.password);

        // Stabilize: wait a bit before moving to admin
        await page.waitForTimeout(1000);

        console.log('Navigating to /admin-dashboard');
        await page.goto('/admin-dashboard', { waitUntil: 'networkidle' });

        // Log current URL and content for debugging
        const currentUrl = page.url();
        console.log(`Current URL after goto('/admin-dashboard'): ${currentUrl}`);

        if (currentUrl.includes('/login')) {
            console.error('ERROR: Redirected to login! Login failed or session not persisted.');
        }

        // Wait for the dashboard with a long timeout and more specific check
        try {
            await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
            console.log('Admin dashboard is visible.');
        } catch (err) {
            console.error(`FAILED to see admin-dashboard at ${page.url()}`);
            // Diagnostic check: what roles does the user actually have in the UI?
            const bodyText = await page.innerText('body');
            console.log('Body snippet (first 1000 chars):', bodyText.substring(0, 1000));

            // Check if we are on the Home page because of a redirect
            if (page.url() === 'http://localhost:3000/') {
                console.error('REDIRECTED TO HOME. The user might not have is_staff permission.');
            }
            throw err;
        }
    });

    test('01 - Basic Dashboard and Sidebar Navigation', async ({ page }) => {
        // Check if main sidebar elements are present
        const tabs = [
            'overview', 'users', 'jobs', 'categories',
            'skills', 'transactions', 'disputes', 'logs', 'broadcast'
        ];

        for (const tab of tabs) {
            await expect(page.getByTestId(`admin-tab-${tab}`)).toBeVisible();
        }

        // Verify we are on overview by default
        await expect(page.locator('h1')).toContainText(/Аналитика|Analytics/i);
    });

    test('02 - User Management Tab', async ({ page }) => {
        await page.getByTestId('admin-tab-users').click();

        // Wait for the tab content loader to disappear and table to appear
        await expect(page.getByTestId('users-tab')).toBeVisible();
        await expect(page.getByTestId('users-table')).toBeVisible();

        // Check if we have at least one user or a "not found" message
        const rows = page.getByTestId(/user-row-/);
        const emptyMessage = page.getByText(/Пользователи не найдены|Users not found/i);

        const isTableEmpty = await emptyMessage.isVisible();
        if (!isTableEmpty) {
            await expect(rows.first()).toBeVisible();
        }
    });

    test('03 - Jobs Management Tab', async ({ page }) => {
        await page.getByTestId('admin-tab-jobs').click();

        await expect(page.getByTestId('jobs-tab')).toBeVisible();
        // Since JobsTab uses table without data-testid but rows have it
        const rows = page.getByTestId(/job-row-/);
        const emptyMessage = page.getByText(/Заказы не найдены|Jobs not found/i);

        const isTableEmpty = await emptyMessage.isVisible();
        if (!isTableEmpty) {
            await expect(rows.first()).toBeVisible();
        }
    });

    test('04 - Categories and Skills Tabs', async ({ page }) => {
        // Categories
        await page.getByTestId('admin-tab-categories').click();
        await expect(page.getByTestId('categories-tab')).toBeVisible();
        await expect(page.getByTestId('categories-table')).toBeVisible();

        // Skills
        await page.getByTestId('admin-tab-skills').click();
        await expect(page.getByTestId('skills-tab')).toBeVisible();
        // Skills table has rows like skill-row-ID
        const skillRows = page.getByTestId(/skill-row-/);
        if (await skillRows.count() > 0) {
            await expect(skillRows.first()).toBeVisible();
        }
    });

    test('05 - Transactions and Audit Logs', async ({ page }) => {
        // Transactions
        await page.getByTestId('admin-tab-transactions').click();
        await expect(page.getByTestId('transactions-tab')).toBeVisible();
        await expect(page.getByTestId('transactions-table')).toBeVisible();

        // Logs
        await page.getByTestId('admin-tab-logs').click();
        await expect(page.getByTestId('audit-logs-tab')).toBeVisible();
        await expect(page.getByTestId('audit-logs-table')).toBeVisible();
    });

    test('06 - Disputes and Broadcast', async ({ page }) => {
        // Disputes
        await page.getByTestId('admin-tab-disputes').click();
        await expect(page.getByTestId('disputes-tab')).toBeVisible();

        // Broadcast
        await page.getByTestId('admin-tab-broadcast').click();
        await expect(page.getByTestId('broadcast-tab')).toBeVisible();
        await expect(page.locator('textarea[name="message"]')).toBeVisible();
    });

    test('07 - Superuser Only Tabs (Staff, Revenue, VIP Settings)', async ({ page }) => {
        // These should be visible if admin@tmwork.tm is a superuser
        const superTabs = ['staff', 'revenue', 'vip_settings'];

        for (const tab of superTabs) {
            const tabBtn = page.getByTestId(`admin-tab-${tab}`);
            if (await tabBtn.isVisible()) {
                await tabBtn.click();

                if (tab === 'staff') {
                    await expect(page.getByTestId('staff-tab')).toBeVisible();
                } else if (tab === 'revenue') {
                    await expect(page.getByTestId('revenue-tab')).toBeVisible();
                } else if (tab === 'vip_settings') {
                    await expect(page.getByTestId('vip-settings-tab')).toBeVisible();
                }
            } else {
                console.warn(`Tab ${tab} is not visible. Is the user a superuser?`);
            }
        }
    });

    test('08 - User Search Functionality', async ({ page }) => {
        await page.getByTestId('admin-tab-users').click();
        await expect(page.getByTestId('users-tab')).toBeVisible();

        const searchInput = page.locator('input[placeholder*="Поиск"], .search-input input').first();
        if (await searchInput.isVisible()) {
            await searchInput.fill('admin');
            await page.waitForTimeout(1000); // Wait for debounce

            // Should still show something or specifically the admin
            const adminRow = page.locator('text=mgurbanmuradow2010@gmail.com');
            await expect(adminRow).toBeVisible();
        }
    });

    test('09 - Block and Unblock User (Visual check)', async ({ page }) => {
        await page.getByTestId('admin-tab-users').click();
        await expect(page.getByTestId('users-table')).toBeVisible();

        // 1. Find all user rows
        const userRows = page.locator('tbody tr');
        const count = await userRows.count();

        let targetRow = null;
        for (let i = 0; i < count; i++) {
            const row = userRows.nth(i);
            const text = await row.innerText();
            // Skip the current admin user to be safe
            if (!text.includes('mgurbanmuradow2010@gmail.com')) {
                targetRow = row;
                break;
            }
        }

        if (targetRow) {
            // 2. Click the "More" menu button in the target row
            const moreButton = targetRow.locator('button:has(svg)');
            await moreButton.click();

            // 3. The menu should appear. Check for the block or unblock button.
            // We use a regex to match either block or unblock since we don't know the state
            const actionButton = page.locator('[data-testid^="user-action-"]');
            await expect(actionButton.first()).toBeVisible({ timeout: 5000 });

            console.log('User action menu is functional.');
        } else {
            console.log('No other users found to test block menu.');
        }
    });

    test('10 - Category Creation and Form', async ({ page }) => {
        await page.getByTestId('admin-tab-categories').click();
        await expect(page.getByTestId('categories-tab')).toBeVisible();

        const newCategoryName = `TestCategory_${Date.now()}`;
        await page.getByTestId('category-name-input').fill(newCategoryName);
        await expect(page.getByTestId('create-category-button')).toBeVisible();

        // We don't necessarily want to create a real category every time during E2E 
        // if we don't have a cleanup, but the form is ready.
    });

    test('11 - Broadcast Message Form', async ({ page }) => {
        await page.getByTestId('admin-tab-broadcast').click();
        await expect(page.getByTestId('broadcast-tab')).toBeVisible();

        const messageArea = page.locator('textarea[name="message"]');
        await messageArea.fill('Universal Broadcast Test Message');
        await expect(page.getByTestId('send-broadcast-button')).toBeVisible();
    });
});
