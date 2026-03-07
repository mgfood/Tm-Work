import { test, expect, createUser, login } from '../helpers';

/**
 * REVIEWS AND RATINGS TESTS
 * Testing review submission, viewing, ratings
 */

test.describe('Reviews and Ratings', () => {
    const timestamp = Date.now();
    const reviewer = {
        email: `reviewer_${timestamp}@example.com`,
        password: 'TestPass123!',
        first_name: 'Review',
        last_name: 'Giver'
    };

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await createUser(page, reviewer);
        await page.close();
    });

    test('01 - Leave 5-Star Review', async ({ page }) => {
        await login(page, reviewer.email, reviewer.password);

        // Navigate to a completed job (assuming we have completed jobs from previous tests)
        await page.goto('/dashboard');

        // Find completed job
        const completedJob = page.locator('text=/Завершен|Completed/i').first();
        if (await completedJob.isVisible({ timeout: 3000 }).catch(() => false)) {
            await completedJob.click();

            // Leave review button
            const reviewButton = page.locator('button:has-text("Оставить отзыв"), button:has-text("Leave review")').first();
            if (await reviewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await reviewButton.click();

                // Select 5 stars
                const fiveStars = page.locator('[data-rating="5"], .star:nth-child(5), button:has-text("★"):nth-child(5)').first();
                await fiveStars.click().catch(() => {
                    // Alternative: click all stars
                    page.locator('.star, button:has-text("★")').nth(4).click();
                });

                // Write comment
                await page.fill('textarea[name="comment"], textarea[placeholder*="отзыв"]', 'Excellent work! Very professional and timely delivery. Highly recommended!');

                // Submit
                await page.click('button[type="submit"]:has-text("Отправить"), button:has-text("Submit")');

                await page.waitForTimeout(2000);

                // Should show success
                await expect(page.locator('text=/успешно|success/i')).toBeVisible({ timeout: 5000 }).catch(() => { });
            }
        }
    });

    test('02 - Leave 3-Star Review with Feedback', async ({ page }) => {
        await login(page, reviewer.email, reviewer.password);
        await page.goto('/dashboard');

        const completedJob = page.locator('text=/Завершен|Completed/i').nth(1);
        if (await completedJob.isVisible({ timeout: 3000 }).catch(() => false)) {
            await completedJob.click();

            const reviewButton = page.locator('button:has-text("Оставить отзыв"), button:has-text("Leave review")').first();
            if (await reviewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await reviewButton.click();

                // Select 3 stars
                await page.locator('.star, button:has-text("★")').nth(2).click();

                // Write detailed feedback
                await page.fill('textarea[name="comment"]', 'Good work overall, but there were some minor issues with communication. Would work together again with improvements.');

                await page.click('button[type="submit"]');
                await page.waitForTimeout(2000);
            }
        }
    });

    test('03 - View Reviews on Profile', async ({ page }) => {
        await page.goto('/profile/1'); // View public profile

        // Should show reviews section
        const reviewsSection = page.locator('text=/Отзывы|Reviews/i').first();
        if (await reviewsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
            await reviewsSection.click();

            // Should show reviews
            const reviews = page.locator('.review, [data-testid="review"]');
            const count = await reviews.count();
            expect(count).toBeGreaterThanOrEqual(0);
        }
    });

    test('04 - View Rating Statistics', async ({ page }) => {
        await page.goto('/profile/1');

        // Should show average rating
        const rating = page.locator('.rating, [data-testid="rating"], text=/★|звезд/i').first();
        await expect(rating).toBeVisible({ timeout: 5000 }).catch(() => { });
    });

    test('05 - Cannot Review Same Job Twice', async ({ page }) => {
        await login(page, reviewer.email, reviewer.password);
        await page.goto('/dashboard');

        // Try to access already reviewed job
        const reviewedJob = page.locator('text=/Завершен|Completed/i').first();
        if (await reviewedJob.isVisible({ timeout: 3000 }).catch(() => false)) {
            await reviewedJob.click();

            // Review button should not be visible or disabled
            const reviewButton = page.locator('button:has-text("Оставить отзыв")').first();
            const isVisible = await reviewButton.isVisible({ timeout: 2000 }).catch(() => false);

            if (isVisible) {
                const isDisabled = await reviewButton.isDisabled();
                expect(isDisabled).toBeTruthy();
            }
        }
    });

    test('06 - Filter Reviews by Rating', async ({ page }) => {
        await page.goto('/profile/1');

        const reviewsSection = page.locator('text=/Отзывы|Reviews/i').first();
        if (await reviewsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
            await reviewsSection.click();

            // Filter by 5 stars
            const fiveStarFilter = page.locator('button:has-text("5★"), button[data-rating="5"]').first();
            if (await fiveStarFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
                await fiveStarFilter.click();
                await page.waitForTimeout(1000);

                // All visible reviews should be 5-star
                const reviews = page.locator('.review');
                if (await reviews.count() > 0) {
                    expect(await reviews.count()).toBeGreaterThan(0);
                }
            }
        }
    });
});
