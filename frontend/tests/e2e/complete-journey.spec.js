import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E Test Suite for TmWork Platform
 * Tests the complete user journey from registration to reviews
 */

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8000';

// Test data
const clientData = {
    email: `client_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'Client'
};

const freelancerData = {
    email: `freelancer_${Date.now()}@test.com`,
    password: 'TestPassword123!',
    first_name: 'Test',
    last_name: 'Freelancer'
};

test.describe('Complete User Journey E2E Tests', () => {

    test('01 - Client Registration and Profile Setup', async ({ page }) => {
        await page.goto(`${BASE_URL}/register`);

        // Fill registration form
        await page.fill('input[name="email"]', clientData.email);
        await page.fill('input[name="password"]', clientData.password);
        await page.fill('input[name="first_name"]', clientData.first_name);
        await page.fill('input[name="last_name"]', clientData.last_name);

        // Submit form
        await page.click('button[type="submit"]');

        // Wait for redirect to homepage
        await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });

        // Verify user is logged in
        const userMenu = page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Профиль")');
        await expect(userMenu).toBeVisible({ timeout: 5000 });
    });

    test('02 - Freelancer Registration and Profile Setup', async ({ page }) => {
        await page.goto(`${BASE_URL}/register`);

        // Fill registration form
        await page.fill('input[name="email"]', freelancerData.email);
        await page.fill('input[name="password"]', freelancerData.password);
        await page.fill('input[name="first_name"]', freelancerData.first_name);
        await page.fill('input[name="last_name"]', freelancerData.last_name);

        // Submit
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });

        // Navigate to profile
        await page.goto(`${BASE_URL}/profile`);

        // Verify profile page loaded
        await expect(page).toHaveURL(/.*profile/);
    });

    test('03 - Client Login', async ({ page }) => {
        await page.goto(`${BASE_URL}/login`);

        await page.fill('input[name="email"]', clientData.email);
        await page.fill('input[name="password"]', clientData.password);
        await page.click('button[type="submit"]');

        await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });

        // Verify logged in
        const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Профиль")');
        await expect(userMenu).toBeVisible({ timeout: 5000 });
    });

    test('04 - Create Job as Client', async ({ page, context }) => {
        // Login as client first
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', clientData.email);
        await page.fill('input[name="password"]', clientData.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`, { timeout: 5000 });

        // Navigate to create job
        await page.goto(`${BASE_URL}/jobs/create`);

        // Fill job form
        await page.fill('input[name="title"]', 'Test E2E Job');
        await page.fill('textarea[name="description"]', 'This is a test job for E2E testing');
        await page.fill('input[name="budget"]', '1000');

        // Set deadline (7 days from now)
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + 7);
        const deadlineStr = deadline.toISOString().split('T')[0];
        await page.fill('input[type="date"], input[name="deadline"]', deadlineStr);

        // Select category
        await page.click('select[name="category"]');
        await page.selectOption('select[name="category"]', { index: 1 });

        // Submit job
        await page.click('button[type="submit"]:has-text("Создать"), button:has-text("Опубликовать")');

        // Wait for redirect
        await page.waitForTimeout(2000);

        // Verify job exists
        await page.goto(`${BASE_URL}/jobs`);
        await expect(page.locator('text=Test E2E Job')).toBeVisible({ timeout: 5000 });
    });

    test('05 - Submit Proposal as Freelancer', async ({ page }) => {
        // Login as freelancer
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', freelancerData.email);
        await page.fill('input[name="password"]', freelancerData.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`);

        // Go to jobs page
        await page.goto(`${BASE_URL}/jobs`);

        // Find and click on test job
        await page.click('text=Test E2E Job');

        // Submit proposal
        await page.fill('textarea[name="message"], textarea[placeholder*="предложение"]', 'I can complete this job efficiently');
        await page.fill('input[name="price"], input[name="proposed_price"]', '900');
        await page.fill('input[name="delivery_time"], input[name="estimated_days"]', '5');

        await page.click('button:has-text("Отправить"), button:has-text("Подать")');

        // Verify proposal submitted
        await expect(page.locator('text=Предложение отправлено, text=успешно')).toBeVisible({ timeout: 5000 });
    });

    test('06 - Accept Proposal and Start Job', async ({ page }) => {
        // Login as client
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', clientData.email);
        await page.fill('input[name="password"]', clientData.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`);

        // Go to my jobs
        await page.goto(`${BASE_URL}/dashboard`);
        await page.click('text=Test E2E Job');

        // Accept the proposal
        await page.click('button:has-text("Принять"), button:has-text("Accept")');

        // Confirm acceptance
        await page.click('button:has-text("Да"), button:has-text("Подтвердить")');

        // Verify job status changed
        await expect(page.locator('text=В работе, text=In Progress')).toBeVisible({ timeout: 5000 });
    });

    test('07 - Chat Between Client and Freelancer', async ({ page }) => {
        // Login as client
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', clientData.email);
        await page.fill('input[name="password"]', clientData.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`);

        // Go to chat
        await page.goto(`${BASE_URL}/chat`);

        // Select conversation with freelancer
        await page.click(`text=${freelancerData.first_name}`);

        // Send message
        const testMessage = 'Hello, how is the work progressing?';
        await page.fill('input[placeholder*="Сообщение"], textarea[placeholder*="Сообщение"]', testMessage);
        await page.click('button[type="submit"], button:has(svg)'); // Send button

        // Verify message sent
        await expect(page.locator(`text=${testMessage}`)).toBeVisible({ timeout: 5000 });
    });

    test('08 - Complete Job and Release Payment', async ({ page }) => {
        // Login as freelancer
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', freelancerData.email);
        await page.fill('input[name="password"]', freelancerData.password);
        await page.click('button[type="submit"]');
        await page.waitForURL(`${BASE_URL}/`);

        // Go to active job
        await page.goto(`${BASE_URL}/dashboard`);
        await page.click('text=Test E2E Job');

        // Submit work
        await page.fill('textarea[name="submission"]', 'Work completed successfully!');
        await page.click('button:has-text("Сдать"), button:has-text("Submit")');

        // Switch to client
        await page.goto(`${BASE_URL}/logout`);
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', clientData.email);
        await page.fill('input[name="password"]', clientData.password);
        await page.click('button[type="submit"]');

        // Approve work
        await page.goto(`${BASE_URL}/dashboard`);
        await page.click('text=Test E2E Job');
        await page.click('button:has-text("Подтвердить"), button:has-text("Approve")');

        // Verify payment released
        await expect(page.locator('text=Завершен, text=Completed')).toBeVisible({ timeout: 5000 });
    });

    test('09 - Leave Review', async ({ page }) => {
        // Login as client
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', clientData.email);
        await page.fill('input[name="password"]', clientData.password);
        await page.click('button[type="submit"]');

        // Go to completed job
        await page.goto(`${BASE_URL}/dashboard`);
        await page.click('text=Test E2E Job');

        // Leave review
        await page.click('button:has-text("Оставить отзыв"), button:has-text("Review")');

        // Select rating (5 stars)
        await page.click('[data-rating="5"], button:has-text("★"):nth-child(5)');

        // Write comment
        await page.fill('textarea[name="comment"]', 'Excellent work! Very professional.');

        // Submit review
        await page.click('button:has-text("Отправить"), button[type="submit"]');

        // Verify review submitted
        await expect(page.locator('text=Отзыв отправлен, text=успешно')).toBeVisible({ timeout: 5000 });
    });

    test('10 - Admin Panel Access (Superuser)', async ({ page }) => {
        // This test assumes a superuser exists
        await page.goto(`${BASE_URL}/login`);
        await page.fill('input[name="email"]', 'admin@tmwork.tm');
        await page.fill('input[name="password"]', 'admin');
        await page.click('button[type="submit"]');

        // Navigate to admin panel
        await page.goto(`${BASE_URL}/admin`);

        // Verify admin dashboard loaded
        await expect(page.locator('text=TmWork Admin, text=Аналитика')).toBeVisible({ timeout: 5000 });

        // Check various tabs
        await page.click('text=Пользователи, text=Users');
        await expect(page).toHaveURL(/.*admin/);

        await page.click('text=Персонал, text=Staff');
        await expect(page.locator('text=Управление персоналом')).toBeVisible({ timeout: 5000 });

        await page.click('text=Доходы, text=Revenue');
        await expect(page.locator('text=Доходы платформы')).toBeVisible({ timeout: 5000 });
    });
});
