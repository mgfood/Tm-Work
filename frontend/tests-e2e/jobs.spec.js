import { test, expect } from '@playwright/test';

test.describe('Jobs Lifecycle E2E', () => {
    test('should complete a full job lifecycle: create -> propose -> accept', async ({ browser }) => {
        // 1. Setup two different contexts (users) to simulate different browsers/sessions
        const clientContext = await browser.newContext();
        const freelancerContext = await browser.newContext();

        const clientPage = await clientContext.newPage();
        const freelancerPage = await freelancerContext.newPage();

        // Unique data for this run
        const runId = Date.now();
        const clientEmail = `client_${runId}@test.com`;
        const freelancerEmail = `freelancer_${runId}@test.com`;
        const password = 'Password123!';
        const jobTitle = `E2E Project ${runId}`;

        // --- STEP 1: CLIENT REGISTRATION ---
        console.log('Registering client...');
        await clientPage.goto('/register');
        await clientPage.fill('input[name="first_name"]', 'Client');
        await clientPage.fill('input[name="last_name"]', 'User');
        await clientPage.fill('input[name="email"]', clientEmail);
        await clientPage.fill('input[name="password"]', password);
        await clientPage.fill('input[name="password_confirm"]', password);

        await clientPage.click('button[type="submit"]');
        await expect(clientPage).toHaveURL('/', { timeout: 20000 });
        console.log('Client registered successfully.');

        // --- STEP 2: CLIENT CREATES A JOB ---
        console.log('Creating job...');
        await clientPage.goto('/jobs/create');
        await clientPage.fill('input[name="title"]', jobTitle);

        // Select category
        const categorySelect = clientPage.locator('select[name="category_id"]');
        await expect(categorySelect).not.toBeDisabled();
        await categorySelect.selectOption({ index: 1 });

        await clientPage.fill('textarea[name="description"]', 'Detailed description for E2E testing. This should be a long enough text to pass any potential validation rules.');
        await clientPage.fill('input[name="budget"]', '500');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deadlineStr = tomorrow.toISOString().slice(0, 16);
        await clientPage.fill('input[name="deadline"]', deadlineStr);

        // Click Publish (button with Send icon)
        await clientPage.click('button:has(svg.lucide-send)');

        // Should be redirected to job detail
        await expect(clientPage).toHaveURL(/\/jobs\/\d+/, { timeout: 20000 });
        const jobUrl = clientPage.url();
        console.log(`Job created at: ${jobUrl}`);

        // --- STEP 3: FREELANCER REGISTRATION ---
        console.log('Registering freelancer...');
        await freelancerPage.goto('/register');
        await freelancerPage.fill('input[name="first_name"]', 'Freelancer');
        await freelancerPage.fill('input[name="last_name"]', 'User');
        await freelancerPage.fill('input[name="email"]', freelancerEmail);
        await freelancerPage.fill('input[name="password"]', password);
        await freelancerPage.fill('input[name="password_confirm"]', password);

        // Select Freelancer role (icon lucide-graduation-cap)
        // We click the button that contains the icon
        await freelancerPage.click('button:has(svg.lucide-graduation-cap)');

        await freelancerPage.click('button[type="submit"]');

        try {
            await expect(freelancerPage).toHaveURL('/', { timeout: 20000 });
            console.log('Freelancer registered successfully.');
        } catch (e) {
            // Check for visible error messages if registration failed
            const errorMsg = await freelancerPage.locator('.bg-red-50').innerText().catch(() => 'No error message found');
            console.error(`Freelancer registration failed at /register. Error on page: ${errorMsg}`);
            throw e;
        }

        // --- STEP 4: FREELANCER APPLIES TO THE JOB ---
        console.log('Freelancer applying to job...');
        await freelancerPage.goto(jobUrl);

        // Use more robust selectors for inputs (fill by proximity to icons if possible, or just orders)
        // Price: first number input in the sidebar
        await freelancerPage.locator('input[type="number"]').first().fill('450');
        // Deadline: second number input
        await freelancerPage.locator('input[type="number"]').nth(1).fill('5');
        // Proposal message
        await freelancerPage.locator('textarea').fill('I am a robot and I will finish this job in no time. Hire me!');

        // Submit proposal (Send icon)
        await freelancerPage.click('button:has(svg.lucide-send)');

        // Success indicator (Green box usually appears)
        await expect(freelancerPage.locator('.bg-green-50')).toBeVisible({ timeout: 15000 });
        console.log('Proposal sent successfully.');

        // --- STEP 5: CLIENT ACCEPTS THE PROPOSAL ---
        console.log('Client accepting proposal...');
        await clientPage.reload();
        // Accept button (Check icon)
        const acceptBtn = clientPage.locator('button:has(svg.lucide-check)');
        await expect(acceptBtn).toBeVisible({ timeout: 15000 });

        clientPage.once('dialog', dialog => dialog.accept());
        await acceptBtn.click();

        // Verify status changed to "In Progress" (Check for Clock icon in the info area)
        await expect(clientPage.locator('div.premium-card:has(svg.lucide-clock)')).toBeVisible({ timeout: 20000 });
        console.log('Job accepted and in progress (E2E Success).');

        // Cleanup
        await clientContext.close();
        await freelancerContext.close();
    });
});
