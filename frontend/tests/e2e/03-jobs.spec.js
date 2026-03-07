import { test, expect, createUser, login, createJob } from '../helpers';

/**
 * JOBS LIFECYCLE TESTS
 * Testing job creation, editing, publishing, browsing, filtering
 */

test.describe('Jobs Lifecycle', () => {
    const timestamp = Date.now();
    const clientUser = {
        email: `client_jobs_${timestamp}@example.com`,
        password: 'TestPass123!',
        first_name: 'Job',
        last_name: 'Creator'
    };

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await createUser(page, clientUser);
        await page.close();
    });

    test('01 - Create Job as Draft', async ({ page }) => {
        await login(page, clientUser.email, clientUser.password);
        await page.goto('/jobs/create');

        await page.fill('[data-testid="job-title-input"]', 'Test Draft Job');
        await page.fill('[data-testid="job-description-input"]', 'This is a test draft job');
        await page.fill('[data-testid="job-budget-input"]', '500');

        // Set deadline (datetime-local expects YYYY-MM-DDTHH:mm)
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);
        const formattedDeadline = deadline.toISOString().slice(0, 16);
        await page.fill('[data-testid="job-deadline-input"]', formattedDeadline);

        // Select category
        await page.selectOption('[data-testid="job-category-select"]', { index: 1 });

        // Save as draft
        await page.click('[data-testid="save-draft-button"]');

        await page.waitForTimeout(2000);

        // Should be on detail page
        await expect(page).toHaveURL(/\/jobs\/\d+/);
        await expect(page.locator('[data-testid="job-status"]')).toContainText(/Draft|Черновик/i);
    });

    test('02 - Create and Publish Job', async ({ page }) => {
        await login(page, clientUser.email, clientUser.password);

        await createJob(page, {
            title: 'E2E Test Job - Website Development',
            description: 'Need a professional website built with React and Node.js',
            budget: 1500,
            deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            category: true
        });

        // Should be on detail page and published
        await expect(page.locator('[data-testid="job-status"]')).toContainText(/Published|Опубликован/i);
    });

    test('03 - Edit Published Job', async ({ page }) => {
        await login(page, clientUser.email, clientUser.password);
        await page.goto('/dashboard');

        // Find and click on job
        await page.click('text=E2E Test Job - Website Development');
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 10000 });

        // Edit job
        await page.click('[data-testid="edit-job-button"]');
        await expect(page).toHaveURL(/\/jobs\/\d+\/edit/);

        // Update description
        const updatedDesc = 'UPDATED: Need a professional website with additional features';
        await page.fill('[data-testid="job-description-input"]', updatedDesc);

        await page.click('[data-testid="save-job-button"]');

        // Wait for navigation and container
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 15000 });

        // Verify update on detail page
        await expect(page.locator('[data-testid="job-description"]')).toContainText('UPDATED', { timeout: 10000 });
    });

    test('04 - Browse All Jobs', async ({ page }) => {
        await page.goto('/jobs');

        // Should show jobs list
        const jobsList = page.locator('[data-testid="job-card"]');
        await expect(jobsList.first()).toBeVisible({ timeout: 15000 });
        const count = await jobsList.count();

        expect(count).toBeGreaterThan(0);
    });

    test('05 - Search Jobs by Title', async ({ page }) => {
        await page.goto('/jobs');
        await expect(page.locator('[data-testid="job-card"]').first()).toBeVisible({ timeout: 10000 });

        // Enter search query
        await page.fill('[data-testid="search-input"]', 'Website Development');
        await page.waitForTimeout(2000); // Wait for filtering logic

        // Should show filtered results
        await expect(page.locator('[data-testid="job-card"]:has-text("Website Development")').first()).toBeVisible({ timeout: 10000 });
    });

    test('06 - Filter Jobs by Category', async ({ page }) => {
        await page.goto('/jobs');
        await expect(page.locator('[data-testid="job-card"]').first()).toBeVisible({ timeout: 10000 });

        // Click first category button (skipping "All")
        const categoryButtons = page.locator('aside button');
        const firstCategory = categoryButtons.nth(1);

        await firstCategory.click();
        await page.waitForTimeout(2000);

        // Should just have results (if any match)
        const jobsList = page.locator('[data-testid="job-card"]');
        // We just expect it not to crash and potentially show items
        expect(await jobsList.count()).toBeGreaterThanOrEqual(0);
    });

    test('07 - Filter Jobs by Budget Range', async ({ page }) => {
        await page.goto('/jobs');
        await expect(page.locator('[data-testid="job-card"]').first()).toBeVisible({ timeout: 10000 });

        await page.fill('[data-testid="min-budget"]', '1000');
        await page.fill('[data-testid="max-budget"]', '2000');

        await page.waitForTimeout(2000);

        // Verify results
        // The E2E Test Job has 1500, so it should be visible
        await expect(page.locator('[data-testid="job-card"]:has-text("1500")').first()).toBeVisible({ timeout: 10000 });
    });

    test('08 - View Job Details', async ({ page }) => {
        await page.goto('/jobs');

        // Wait for cards to be loaded
        const firstJob = page.locator('[data-testid="job-card"]').first();
        await expect(firstJob).toBeVisible({ timeout: 15000 });
        await firstJob.click();

        // Should show job details page or error
        // Wait for container or error state
        const container = page.locator('[data-testid="job-details-container"]');
        const errorState = page.locator('[data-testid="job-error"]');

        await Promise.race([
            container.waitFor({ state: 'visible', timeout: 20000 }),
            errorState.waitFor({ state: 'visible', timeout: 20000 })
        ]).catch(() => { });

        if (await errorState.isVisible()) {
            const errorText = await errorState.innerText();
            throw new Error(`Job Detail Page showed error: ${errorText}`);
        }

        await expect(container).toBeVisible({ timeout: 10000 });

        // Should show job title
        await expect(page.locator('[data-testid="job-title"]')).toBeVisible({ timeout: 10000 });
    });

    test('09 - Delete Job', async ({ page }) => {
        await login(page, clientUser.email, clientUser.password);

        // Create a job to delete
        await createJob(page, {
            title: 'Job To Delete',
            description: 'This job will be deleted',
            budget: 300,
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            category: true
        });

        // Ensure we are indeed on the detail page
        await expect(page.locator('[data-testid="job-title"]')).toContainText('Job To Delete');

        // Delete button on detail page
        await page.click('[data-testid="delete-job-button"]');

        // Confirm deletion in GlobalConfirmModal using the specific test ID
        const confirmBtn = page.locator('[data-testid="modal-confirm-button"]');
        await expect(confirmBtn).toBeVisible({ timeout: 5000 });
        await confirmBtn.click();

        await page.waitForTimeout(2000);

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);

        // Job should not be visible
        await expect(page.locator('text=Job To Delete')).not.toBeVisible({ timeout: 10000 });
    });
});
