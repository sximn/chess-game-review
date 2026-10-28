import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
	testDir: 'tests/browser',
	timeout: 120000,
	expect: { timeout: 15000 },
	fullyParallel: false,
	workers: 1,
	reporter: [
		['list'],
		[
			'json',
			{
				outputFile: process.env.ENGINE_BROWSER_REPORT || 'artifacts/frozenight/browser-results.json'
			}
		]
	],
	use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
	webServer: {
		command: 'bun run preview -- --port 4173',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }
	]
});
