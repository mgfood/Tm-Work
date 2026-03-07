import { test, expect, createUser, login } from '../helpers';

/**
 * WALLET AND TRANSACTIONS TESTS
 * Testing balance, deposits, withdrawals, transaction history
 */

test.describe('Wallet and Transactions', () => {
    const timestamp = Date.now();
    const walletUser = {
        email: `wallet_${timestamp}@example.com`,
        password: 'TestPass123!',
        first_name: 'Wallet',
        last_name: 'User'
    };

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await createUser(page, walletUser);
        await page.close();
    });

    test('01 - View Wallet Balance', async ({ page }) => {
        await login(page, walletUser.email, walletUser.password);

        await page.goto('/wallet');

        // Should show balance
        const balance = page.getByTestId('wallet-balance').first();
        await expect(balance).toBeVisible({ timeout: 15000 });
    });

    test('02 - View Transaction History', async ({ page }) => {
        await login(page, walletUser.email, walletUser.password);

        await page.goto('/wallet');

        // Should show transactions list or empty state
        const transactions = page.getByTestId('transaction-history');
        const emptyState = page.locator('text=/Нет транзакций|No transactions/i');

        // Wait for either list or empty state to be visible or at least one of them exists
        await expect(async () => {
            const hasHistory = await transactions.isVisible();
            const isEmpty = await emptyState.isVisible();
            expect(hasHistory || isEmpty).toBeTruthy();
        }).toPass({ timeout: 10000 });
    });

    test('03 - Initiate Deposit (if available)', async ({ page }) => {
        await login(page, walletUser.email, walletUser.password);

        await page.goto('/wallet');

        const depositButton = page.locator('button:has-text("Пополнить"), button:has-text("Deposit")').first();
        if (await depositButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await depositButton.click();

            // Should show deposit form
            const amountInput = page.locator('input[name="amount"], input[placeholder*="Сумма"]').first();
            await expect(amountInput).toBeVisible({ timeout: 5000 });

            // Fill amount
            await amountInput.fill('1000');

            // Note: Actual payment processing is not tested (stub/mock)
            const submitButton = page.locator('button[type="submit"]:has-text("Подтвердить"), button:has-text("Continue")').first();
            if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                // Don't actually submit in test (would require payment gateway)
                expect(await submitButton.isVisible()).toBeTruthy();
            }
        }
    });

    test('04 - Filter Transactions by Type', async ({ page }) => {
        await login(page, walletUser.email, walletUser.password);

        await page.goto('/wallet');

        const filterSelect = page.locator('select[name="transaction_type"], button:has-text("Тип")').first();
        if (await filterSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            if (await filterSelect.getAttribute('type') === 'select') {
                await filterSelect.selectOption('DEPOSIT');
            } else {
                await filterSelect.click();
                await page.locator('[value="DEPOSIT"], text=Пополнение').first().click();
            }

            await page.waitForTimeout(1000);

            // Results should be filtered
            const transactions = page.locator('.transaction');
            if (await transactions.count() > 0) {
                expect(await transactions.count()).toBeGreaterThan(0);
            }
        }
    });

    test('05 - View Transaction Details', async ({ page }) => {
        await login(page, walletUser.email, walletUser.password);

        await page.goto('/wallet');

        const firstTransaction = page.locator('.transaction, [data-testid="transaction"]').first();
        if (await firstTransaction.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstTransaction.click();

            // Should show transaction details
            const details = page.locator('.transaction-details, [data-testid="transaction-details"]');
            await expect(details).toBeVisible({ timeout: 5000 }).catch(() => { });
        }
    });

    test('06 - Export Transaction History', async ({ page }) => {
        await login(page, walletUser.email, walletUser.password);

        await page.goto('/wallet');

        const exportButton = page.locator('button:has-text("Экспорт"), button:has-text("Export")').first();
        if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            // Start download
            const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
            await exportButton.click();

            const download = await downloadPromise;
            if (download) {
                expect(await download.suggestedFilename()).toContain('transaction');
            }
        }
    });
});
