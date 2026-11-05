import { test, expect } from '@playwright/test';
import { frozenightManifest } from 'chess-engine-kit/frozenight/manual';
import { readEngineAssetUrls } from './engine-assets';
import { OPERA_PGN } from '../fixtures/opera-game';

test('mobile timeline stays aligned after importing a game and exploring an alternative', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page.getByRole('button', { name: 'Import your game', exact: true }).click();
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
	await expect(page.locator('.variation-badge')).toBeVisible();
	await expect(current).toHaveText('Start');
	await expect(current).toBeInViewport();
	const variationStart = page.getByRole('button', {
		name: 'Alternative starting position',
		exact: true
	});
	await variationStart.click();
	await expect(variationStart).toHaveAttribute('aria-current', 'step');
	await expect(current).toHaveText('Start');
	await expect(current).toBeInViewport();
	await page.getByRole('button', { name: 'Next move', exact: true }).click();
	await expect(page.locator('.variation-badge')).toHaveCount(0);
	await expect(current).toContainText('d4');
	await expect(current).toBeInViewport();
});

test('a corrupt engine cache is evicted and repaired before review', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	const assets = await readEngineAssetUrls(page);
	await page.evaluate(async (assets) => {
		await navigator.serviceWorker.ready;
		const cache = await caches.open('chess-engine-kit-assets-v1');
		await cache.put(assets.wasm, new Response('damaged persistent cache'));
		if ((await (await cache.match(assets.wasm))!.text()) !== 'damaged persistent cache')
			throw new Error('The corrupt cache fixture was not stored.');
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([{ id: 'cache-repair', pgn: '1. e4 e5 *', addedAt: new Date().toISOString() }])
		);
	}, assets);
	// Initialize on the seeded page so WebKit cannot discard its CacheStorage
	// during a document navigation before the SDK has read the corrupt bytes.
	await page.getByRole('button', { name: 'Run local diagnostics' }).click();
	await expect(page.getByRole('status')).toHaveText('All local checks passed');
	const repaired = await page.evaluate(
		async ({ assets, expectedHash }) => {
			const cache = await caches.open('chess-engine-kit-assets-v1');
			const bytes = await (await cache.match(assets.wasm))!.arrayBuffer();
			const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');
			return digest === expectedHash;
		},
		{ assets, expectedHash: frozenightManifest.wasm.sha256 }
	);
	expect(repaired).toBe(true);
	await page.goto('/?game=cache-repair');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
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

for (const viewport of [
	{ width: 1440, height: 1000 },
	{ width: 390, height: 844 },
	{ width: 320, height: 568 }
]) {
	test(`Review stays in the middle through empty, imported, and library states at ${viewport.width}px`, async ({
		page
	}, info) => {
		await page.setViewportSize(viewport);
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		const navigation = page.getByRole('navigation', {
			name: viewport.width <= 760 ? 'Mobile navigation' : 'Main navigation'
		});
		const reviewTab = navigation.getByRole('link', { name: 'Review', exact: true });
		const gamesTab = navigation.getByRole('link', { name: 'My games', exact: true });
		const expectTabs = async (active: string) => {
			await expect(navigation.getByRole('link')).toHaveText(['My games', 'Review', 'Preferences']);
			await expect(navigation.locator('[aria-current="page"]')).toHaveText(active);
		};
		await page.goto('/');
		await expectTabs('My games');
		const originalTab = (await reviewTab.boundingBox())!;
		await reviewTab.click();
		await expectTabs('Review');
		await expect(page).toHaveURL(/\/review$/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Import your game.');
		await expect(page.locator('.review-route')).toHaveCount(0);
		await expect(page.locator('.game-library')).toHaveCount(0);
		await page.evaluate(() => document.fonts.ready);
		const importButton = page.getByRole('button', { name: 'Import your game', exact: true });
		await expect(importButton).toBeInViewport();
		if (viewport.width <= 760) {
			const button = (await importButton.boundingBox())!;
			expect(button.y + button.height).toBeLessThanOrEqual((await navigation.boundingBox())!.y);
		}
		await page.screenshot({
			path: `artifacts/app-verification/review-empty-${viewport.width}-${info.project.name}.png`,
			fullPage: true
		});
		await gamesTab.click();
		await expectTabs('My games');
		await expect(page.locator('.welcome-board')).toBeVisible();
		await reviewTab.click();
		await importButton.click();
		await page
			.getByLabel('Game notation', { exact: true })
			.fill('[White "Tab Ada"]\n[Black "Tab Grace"]\n\n1. e4 e5 *');
		await page.getByRole('button', { name: 'Open game', exact: true }).click();
		await expect(page).toHaveURL(/\/review\?game=/);
		await expect(page.locator('.chessboard')).toBeVisible();
		await expectTabs('Review');
		expect((await reviewTab.boundingBox())!.x).toBe(originalTab.x);
		await gamesTab.click();
		await expectTabs('My games');
		await expect(page.locator('.library-game')).toHaveCount(1);
		await expect(page.locator('.welcome-board')).toHaveCount(0);
		await reviewTab.click();
		await expectTabs('Review');
		await expect(page.getByText('Tab Ada', { exact: true }).first()).toBeVisible();
		await navigation.getByRole('link', { name: 'Preferences', exact: true }).click();
		await expectTabs('Preferences');
		await page.reload();
		await reviewTab.click();
		await expectTabs('Review');
		await expect(page.getByText('Tab Ada', { exact: true }).first()).toBeVisible();
		expect(errors).toEqual([]);
	});
}

test('Review remembers the selected library game rather than always using the newest import', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.addInitScript(() => {
		if (localStorage.getItem('upapawn-games')) return;
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([
				{
					id: 'older',
					pgn: '[White "Older"]\n[Black "Opponent"]\n\n1. e4 e5 *',
					addedAt: '2026-11-01'
				},
				{
					id: 'newer',
					pgn: '[White "Newer"]\n[Black "Opponent"]\n\n1. d4 d5 *',
					addedAt: '2026-11-02'
				}
			])
		);
		localStorage.setItem('upapawn-current-game', 'older');
	});
	const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
	await page.goto('/review');
	await expect(page.getByText('Older', { exact: true }).first()).toBeVisible();
	await navigation.getByRole('link', { name: 'My games', exact: true }).click();
	await page.locator('.library-game').filter({ hasText: 'Newer' }).click();
	await expect(page.getByText('Newer', { exact: true }).first()).toBeVisible();
	await navigation.getByRole('link', { name: 'My games', exact: true }).click();
	await page.reload();
	await navigation.getByRole('link', { name: 'Review', exact: true }).click();
	await expect(page.getByText('Newer', { exact: true }).first()).toBeVisible();
});

for (const viewport of [
	{ width: 1440, height: 1000 },
	{ width: 390, height: 844 }
]) {
	test(`tabs preserve the review move and library cards restart at ${viewport.width}px`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		const errors: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		await page.addInitScript((pgn) => {
			localStorage.setItem(
				'upapawn-games',
				JSON.stringify([
					{ id: 'cursor-opera', pgn, addedAt: '2026-11-01' },
					{
						id: 'cursor-other',
						pgn: '[White "Other"]\n[Black "Opponent"]\n\n1. d4 d5 2. c4 e6 *',
						addedAt: '2026-11-02'
					}
				])
			);
		}, OPERA_PGN);
		const navigation = page.getByRole('navigation', {
			name: viewport.width <= 760 ? 'Mobile navigation' : 'Main navigation'
		});
		const current = page.locator('.move-chip[aria-current="step"]');
		const openLibrary = () =>
			navigation.getByRole('link', { name: 'My games', exact: true }).click();
		const returnToReview = () =>
			navigation.getByRole('link', { name: 'Review', exact: true }).click();
		await page.goto('/review?game=cursor-opera');
		await page.locator('.move-chip').nth(29).click();
		await expect(current).toContainText('Bxd7+');
		await openLibrary();
		await expect(page.locator('.library-game')).toHaveCount(2);
		await returnToReview();
		await expect(current).toContainText('Bxd7+');
		await expect(current).toBeInViewport();
		await expect(page.getByRole('img', { name: 'White bishop on d7', exact: true })).toBeVisible();
		await navigation.getByRole('link', { name: 'Preferences', exact: true }).click();
		await returnToReview();
		await expect(current).toContainText('Bxd7+');

		await openLibrary();
		await page.locator('.library-game').filter({ hasText: 'Other' }).click();
		await expect(current).toHaveText('Start');
		await page.locator('.move-chip').nth(2).click();
		await expect(current).toContainText('d5');
		await openLibrary();
		await returnToReview();
		await expect(current).toContainText('d5');
		await expect(current).toBeInViewport();
		await openLibrary();
		await page.locator('.library-game').filter({ hasText: 'Paul Morphy' }).click();
		await expect(current).toHaveText('Start');
		await page.getByRole('button', { name: 'Last move', exact: true }).click();
		await openLibrary();
		await returnToReview();
		await expect(current).toContainText('Rd8#');
		await page.getByRole('button', { name: 'First move', exact: true }).click();
		await openLibrary();
		await returnToReview();
		await expect(current).toHaveText('Start');
		await openLibrary();
		await page.locator('.library-game').filter({ hasText: 'Other' }).click();
		await expect(current).toHaveText('Start');
		expect(errors).toEqual([]);
	});
}
