import { test, expect } from '@playwright/test';

test('mobile timeline stays aligned after importing a game and exploring an alternative', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page
		.getByRole('navigation', { name: 'Mobile navigation' })
		.getByRole('button', { name: 'Import', exact: true })
		.click();
	await page.getByLabel('Game notation', { exact: true }).fill('1. d4 d5 2. c4 e6 3. Nc3 Nf6 *');
	await page.getByRole('button', { name: 'Open game', exact: true }).click();
	const current = page.locator('.move-chip[aria-current="step"]');
	await expect(current).toHaveText('Start');
	await expect(current).toBeInViewport();
	await page.keyboard.press('ArrowRight');
	await expect(current).toContainText('d4');
	await expect(current).toBeInViewport();
	await page.getByRole('button', { name: 'First move', exact: true }).click();
	await expect(current).toHaveText('Start');
	await page.getByRole('button', { name: /analysis/i }).click();
	await page.getByRole('button', { name: 'Explore alternative 1', exact: true }).click();
	await expect(page.getByText('Exploring an alternative', { exact: true })).toBeVisible();
	await expect(current).toBeInViewport();
	await page.getByRole('button', { name: 'Return to game', exact: true }).click();
	await expect(current).toHaveText('Start');
	await expect(current).toBeInViewport();
});

test('engine notices can be read without leaving the app navigation', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/settings');
	const notice = page
		.locator('details')
		.filter({ has: page.locator('summary').filter({ hasText: 'Engine license' }) });
	await notice.locator('summary').click();
	await expect(notice.locator('pre')).toContainText('Mark Carlson');
	await page.getByRole('link', { name: 'Game review', exact: true }).click();
	await expect(page.locator('.chessboard')).toBeVisible();
});

test('a corrupt persistent engine cache is evicted and repaired before review', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/diagnostics');
	await page.evaluate(async () => {
		const manifest = await (await fetch('/engine/frozenight/manifest.json')).json();
		const cache = await caches.open('upapawn-engine-assets-v1');
		await cache.put(
			new URL(manifest.wasmPath, location.href).href,
			new Response('damaged persistent cache')
		);
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([{ id: 'cache-repair', pgn: '1. e4 e5 *', addedAt: new Date().toISOString() }])
		);
	});
	await page.goto('/?game=cache-repair');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	const repaired = await page.evaluate(async () => {
		const manifest = await (await fetch('/engine/frozenight/manifest.json')).json();
		const cache = await caches.open('upapawn-engine-assets-v1');
		const bytes = await (await cache.match(
			new URL(manifest.wasmPath, location.href).href
		))!.arrayBuffer();
		const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		return digest === manifest.wasmSha256;
	});
	expect(repaired).toBe(true);
});

test('a worker crash gives a recoverable review state and retry completes', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.addInitScript(() => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([{ id: 'crash-retry', pgn: '1. e4 e5 *', addedAt: new Date().toISOString() }])
		);
		let inject = true;
		const NativeWorker = window.Worker;
		window.Worker = class extends NativeWorker {
			postMessage(message: any, ...args: any[]) {
				if (inject && message.type === 'analyze') {
					inject = false;
					this.terminate();
					queueMicrotask(() =>
						this.dispatchEvent(new ErrorEvent('error', { message: 'Injected worker crash' }))
					);
					return;
				}
				return super.postMessage(message, ...(args as [any]));
			}
		};
	});
	await page.goto('/?game=crash-retry');
	await expect(page.getByRole('alert')).toContainText('ENGINE_CRASHED');
	await page.getByRole('button', { name: 'Retry analysis', exact: true }).click();
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await expect(page.getByText('3 / 3 positions', { exact: true })).toBeVisible();
});
