import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false, // Run tests sequentially for data consistency
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker to avoid race conditions
    reporter: [
        ['html'],
        ['list']
    ],

    use: {
        baseURL: process.env.VITE_APP_URL || 'http://localhost:3000',
        trace: 'on',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: { 
                ...devices['Desktop Chrome'],
                channel: 'chrome',
            },
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});
