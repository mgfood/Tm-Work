import { test, expect, createUser, login } from '../helpers';

/**
 * CHAT AND MESSAGING TESTS
 * Testing real-time messaging between users
 */

test.describe('Chat and Messaging', () => {
    const timestamp = Date.now();
    const user1 = {
        email: `chat_user1_${timestamp}@example.com`,
        password: 'TestPass123!',
        first_name: 'Chat',
        last_name: 'UserOne'
    };

    const user2 = {
        email: `chat_user2_${timestamp}@example.com`,
        password: 'TestPass123!',
        first_name: `Freelancer${timestamp}`,
        last_name: 'UserTwo',
        roles: ['FREELANCER']
    };

    test.beforeAll(async ({ browser }) => {
        const page = await browser.newPage();
        await createUser(page, user1);
        await page.goto('/logout');
        await createUser(page, user2);
        await page.close();
    });

    test('01 - Access Chat Page', async ({ page }) => {
        // Capture browser console logs
        page.on('console', msg => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`);
            }
        });

        await login(page, user1.email, user1.password);

        await page.goto('/chat');

        // Should show chat interface
        await expect(page).toHaveURL(/\/chat/);
        const chatContainer = page.locator('[data-testid="chat-page"]');
        await expect(chatContainer).toBeVisible({ timeout: 10000 });
    });

    test('02 - Send Message to Another User', async ({ page }) => {
        await login(page, user1.email, user1.password);

        // Go to talents list
        await page.goto('/talents');
        await page.waitForLoadState('networkidle');

        // Wait for at least one talent card to ensure list is loaded
        console.log("Waiting for talent cards to appear...");
        await expect(page.locator('[data-testid="talent-card"]').first()).toBeVisible({ timeout: 15000 });

        // Use search bar to find user2 specifically
        console.log(`Searching for freelancer: ${user2.first_name}`);
        const searchInput = page.locator('[data-testid="talent-search-input"]');
        await searchInput.fill(user2.first_name);

        // Wait for filtering to happen (list should change)
        await page.waitForTimeout(2000);

        // Find user2 card
        const talentCard = page.locator('[data-testid="talent-card"]').filter({ hasText: user2.first_name }).first();

        if (!(await talentCard.isVisible())) {
            const allText = await page.innerText('body');
            console.log("Page content when card not found:", allText.substring(0, 500) + "...");
            const cardsCount = await page.locator('[data-testid="talent-card"]').count();
            console.log(`Number of talent cards visible: ${cardsCount}`);
        }

        await expect(talentCard).toBeVisible({ timeout: 15000 });
        await talentCard.click();

        // Click Message on profile
        await page.click('[data-testid="message-button"]');

        // Should be on chat page now
        await expect(page).toHaveURL(/\/chat/);

        // Send message
        const messageInput = page.locator('[data-testid="message-input"]').first();
        const testMessage = 'Hello from E2E test! ' + timestamp;

        await expect(messageInput).toBeVisible({ timeout: 15000 });
        await messageInput.fill(testMessage);
        await page.click('[data-testid="send-message-button"]');

        await page.waitForTimeout(2000);

        // Message should appear in chat
        const messageBubble = page.getByTestId('message-content').filter({ hasText: testMessage });
        await expect(messageBubble).toBeVisible({ timeout: 15000 });
    });

    test('03 - Receive and Reply to Message', async ({ page }) => {
        // Login as user2
        await login(page, user2.email, user2.password);
        await page.goto('/chat');
        await page.waitForLoadState('networkidle');

        console.log("Waiting for chat threads to load for User2...");
        // Fallback reload if threads don't appear in 5s
        try {
            await page.waitForSelector('[data-testid="chat-thread"]', { timeout: 5000 });
        } catch (e) {
            console.log("Threads not found initially, reloading page...");
            await page.reload();
            await page.waitForLoadState('networkidle');
        }

        // Find conversation with user1
        const firstThread = page.locator('[data-testid="chat-thread"]').first();
        await expect(firstThread).toBeVisible({ timeout: 20000 });
        await firstThread.click();

        // Reply
        const messageInput = page.locator('[data-testid="message-input"]').first();
        const replyText = 'Hi! Received your message. ' + timestamp;
        await expect(messageInput).toBeVisible({ timeout: 10000 });
        await messageInput.fill(replyText);
        await page.click('[data-testid="send-message-button"]');

        await page.waitForTimeout(2000);

        // Reply should appear in message list
        const replyBubble = page.getByTestId('message-content').filter({ hasText: replyText });
        await expect(replyBubble).toBeVisible({ timeout: 10000 });
    });

    test('04 - Send Emoji in Message', async ({ page }) => {
        await login(page, user1.email, user1.password);
        await page.goto('/chat');
        await page.waitForLoadState('networkidle');

        // Select conversation (it should exist now)
        await page.waitForSelector('[data-testid="chat-thread"]', { timeout: 20000 });
        await page.locator('[data-testid="chat-thread"]').first().click();

        // Send message with manual emoji
        const messageInput = page.locator('[data-testid="message-input"]').first();
        await expect(messageInput).toBeVisible({ timeout: 10000 });
        await messageInput.fill('Great! 👍 ' + timestamp);
        await page.click('[data-testid="send-message-button"]');

        await page.waitForTimeout(2000);

        // Should see emoji
        const emojiBubble = page.getByTestId('message-content').filter({ hasText: '👍' }).filter({ hasText: String(timestamp) });
        await expect(emojiBubble).toBeVisible({ timeout: 10000 });
    });

    test('05 - View Chat History', async ({ page }) => {
        await login(page, user1.email, user1.password);
        await page.goto('/chat');
        await page.waitForLoadState('networkidle');

        // Select conversation
        await page.waitForSelector('[data-testid="chat-thread"]', { timeout: 20000 });
        await page.locator('[data-testid="chat-thread"]').first().click();

        // Should see previous messages (using timestamp to be unique)
        // Targeted search within message content only to avoid sidebar overlap
        const historyBubble = page.getByTestId('message-content').filter({ hasText: String(timestamp) });
        await expect(historyBubble.first()).toBeVisible({ timeout: 15000 });
    });

    test('06 - Search Conversations', async ({ page }) => {
        await login(page, user1.email, user1.password);
        await page.goto('/chat');

        const searchInput = page.locator('input[placeholder*="Начните"], input[placeholder*="Search"]').first();
        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
            await searchInput.fill(user2.first_name);
            await page.waitForTimeout(1000);

            // Should show filtered conversation
            await expect(page.locator(`[data-testid="chat-thread"]:has-text("${user2.first_name}")`)).toBeVisible({ timeout: 5000 });
        }
    });
});
