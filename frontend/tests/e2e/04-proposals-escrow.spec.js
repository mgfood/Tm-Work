import { test, expect, createUser, login } from '../helpers';

/**
 * PROPOSALS AND ESCROW TESTS
 * Testing proposal submission, acceptance, rejection, escrow workflow
 */

test.describe('Proposals and Escrow', () => {
    const timestamp = Date.now();
    const client = {
        email: `client_prop_${timestamp}@example.com`,
        password: 'TestPass123!',
        first_name: 'Client',
        last_name: 'Prop',
        roles: ['CLIENT']
    };

    const freelancer = {
        email: `freelancer_prop_${timestamp}@example.com`,
        password: 'TestPass123!',
        first_name: 'Freelancer',
        last_name: 'Prop',
        roles: ['FREELANCER', 'CLIENT']
    };

    let jobId;

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();

        // Create both users
        await createUser(page, client);
        await page.goto('/logout');
        await createUser(page, freelancer);

        await page.close();
    });

    test('Job Lifecycle - From Creation to Completion', async ({ page }) => {
        test.slow(); // Increase timeout for this complex test
        // --- 01 - Client Creates Job ---
        await login(page, client.email, client.password, 'C');

        const jobTitle = `Proposal Job ${timestamp}`;
        await page.goto('/jobs/create');
        await page.fill('[data-testid="job-title-input"]', jobTitle);
        await page.fill('[data-testid="job-description-input"]', 'Job for testing proposals');
        await page.fill('[data-testid="job-budget-input"]', '1000');

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 14);
        const formattedDeadline = deadline.toISOString().slice(0, 16);
        await page.fill('[data-testid="job-deadline-input"]', formattedDeadline);

        await page.selectOption('[data-testid="job-category-select"]', { index: 1 });
        await page.click('[data-testid="publish-job-button"]');
        await page.waitForURL(/\/jobs\/\d+/, { timeout: 15000 });
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 20000 });

        const url = page.url();
        const match = url.match(/\/jobs\/(\d+)/);
        if (match) {
            jobId = match[1];
        }
        expect(jobId).toBeTruthy();

        // --- 02 - Freelancer Submits Proposal ---
        await login(page, freelancer.email, freelancer.password, 'F');
        await page.goto(`/jobs/${jobId}`);
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 20000 });

        await page.fill('[data-testid="proposal-message-input"]', 'I can complete this job efficiently and professionally');
        await page.fill('[data-testid="proposal-price-input"]', '950');
        await page.fill('[data-testid="proposal-deadline-input"]', '7');

        await page.click('[data-testid="submit-proposal-button"]');
        await expect(page.locator('text=/успешно|success|отправлен/i')).toBeVisible({ timeout: 15000 });

        // --- 03 - Client Views Proposals ---
        await login(page, client.email, client.password, 'C');
        await page.goto(`/jobs/${jobId}`);
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 20000 });
        await expect(page.locator('[data-testid="proposal-card"]').first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator(`text=${freelancer.first_name}`)).toBeVisible({ timeout: 10000 });

        // --- 04 - Client Accepts Proposal ---
        const acceptButton = page.locator('[data-testid="accept-proposal-button"]').first();
        await acceptButton.click();

        const confirmBtn = page.locator('[data-testid="modal-confirm-button"]');
        await expect(confirmBtn).toBeVisible({ timeout: 10000 });
        await confirmBtn.click();

        await expect(page.locator('[data-testid="job-status"]')).toHaveAttribute('data-status', 'IN_PROGRESS', { timeout: 20000 });

        // --- 05 - Freelancer Submits Work ---
        await login(page, freelancer.email, freelancer.password, 'F');
        await page.goto(`/jobs/${jobId}`);
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 20000 });

        await page.fill('[data-testid="submission-content-input"]', 'Work completed successfully. deliverables attached.');
        await page.click('[data-testid="submit-work-button"]');

        await expect(page.locator('[data-testid="job-status"]')).toHaveAttribute('data-status', 'SUBMITTED', { timeout: 15000 });

        // --- 06 - Client Approves and Releases Payment ---
        await login(page, client.email, client.password, 'C');
        await page.goto(`/jobs/${jobId}`);
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 20000 });

        await page.click('[data-testid="approve-work-button"]');
        await expect(page.locator('[data-testid="modal-confirm-button"]')).toBeVisible({ timeout: 10000 });
        await page.click('[data-testid="modal-confirm-button"]');

        await expect(page.locator('[data-testid="job-status"]')).toHaveAttribute('data-status', 'COMPLETED', { timeout: 20000 });
    });

    test('07 - Reject Proposal', async ({ page }) => {
        test.slow(); // Give more time for multiple logins and page loads
        await login(page, client.email, client.password, 'C');

        const jobTitle = `Reject Test ${Date.now()}`;
        await page.goto('/jobs/create');

        // Wait for categories to load
        await page.waitForSelector('[data-testid="job-category-select"] option:nth-child(2)', { state: 'attached', timeout: 10000 });

        await page.fill('[data-testid="job-title-input"]', jobTitle);
        await page.fill('[data-testid="job-description-input"]', 'Testing rejection logic');
        await page.fill('[data-testid="job-budget-input"]', '500');

        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);
        const formattedDeadline = deadline.toISOString().slice(0, 16);
        await page.fill('[data-testid="job-deadline-input"]', formattedDeadline);

        await page.selectOption('[data-testid="job-category-select"]', { index: 1 });
        await page.click('[data-testid="publish-job-button"]');

        // Check for immediate errors on the creation page
        const creationError = page.locator('[data-testid="create-job-error"]');
        if (await creationError.isVisible()) {
            const errorText = await creationError.textContent();
            throw new Error(`Create Job failed: ${errorText}`);
        }

        // Wait for redirection to the job page
        await page.waitForURL(/\/jobs\/\d+/, { timeout: 15000 });

        // Wait for loading to finish
        const loadingSpinner = page.locator('[data-testid="job-details-loading"]');
        if (await loadingSpinner.isVisible()) {
            await expect(loadingSpinner).not.toBeVisible({ timeout: 15000 });
        }

        // Ensure we are not on an error page
        const errorHeading = page.locator('[data-testid="job-error"]');
        if (await errorHeading.isVisible()) {
            const errorText = await errorHeading.textContent();
            throw new Error(`Job page showed error: ${errorText}`);
        }

        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 20000 });

        const rejJobId = page.url().match(/\/jobs\/(\d+)/)[1];

        // Freelancer submits proposal
        await login(page, freelancer.email, freelancer.password, 'F');
        await page.goto(`/jobs/${rejJobId}`);
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 20000 });
        await page.fill('[data-testid="proposal-message-input"]', 'Will be rejected');
        await page.fill('[data-testid="proposal-price-input"]', '450');
        await page.fill('[data-testid="proposal-deadline-input"]', '5');
        await page.click('[data-testid="submit-proposal-button"]');
        await page.waitForTimeout(2000); // Keep this for now, as it's a short wait after submission

        // Client rejects
        await login(page, client.email, client.password, 'C');
        await page.goto(`/jobs/${rejJobId}`);
        await expect(page.locator('[data-testid="job-details-container"]')).toBeVisible({ timeout: 20000 });

        await page.click('[data-testid="reject-proposal-button"]');
        await expect(page.locator('[data-testid="modal-confirm-button"]')).toBeVisible({ timeout: 10000 });
        await page.click('[data-testid="modal-confirm-button"]');

        await expect(page.locator('[data-testid="proposal-card"]')).toHaveCount(0, { timeout: 10000 });
    });
});
