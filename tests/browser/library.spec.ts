import { test, expect } from '@playwright/test';

const pgn =
	'[Event "Evening game"]\n[White "Ada"]\n[Black "Grace"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0';

for (const viewport of [
	{ width: 1440, height: 1000 },
	{ width: 390, height: 844 },
	{ width: 320, height: 568 }
]) {
	test(`welcome, import, and saved library at ${viewport.width}px`, async ({ page }, info) => {
		await page.setViewportSize(viewport);
		const errors: string[] = [];
		const engineRequests: string[] = [];
		page.on('pageerror', (error) => errors.push(error.message));
		page.on('request', (request) => {
			if (request.url().includes('.wasm')) engineRequests.push(request.url());
		});
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your next move starts here.');
		await expect(page.locator('.welcome-board img')).toHaveCount(4);
		await expect(page.locator('.review-route')).toHaveCount(0);
		await expect(page.getByText(/Opera|Classics|Paul Morphy/)).toHaveCount(0);
		const importButton = page.getByRole('button', { name: 'Import your game', exact: true });
		await expect(importButton).toHaveCount(1);
		await page.evaluate(() => document.fonts.ready);
		await expect(importButton).toBeInViewport();
		if (viewport.width <= 760) {
			const button = (await importButton.boundingBox())!;
			const nav = (await page
				.getByRole('navigation', { name: 'Mobile navigation' })
				.boundingBox())!;
			expect(button.y + button.height).toBeLessThanOrEqual(nav.y);
		}
		await page.screenshot({
			path: `artifacts/app-verification/welcome-${viewport.width}-${info.project.name}.png`,
			fullPage: true
		});
		expect(engineRequests).toEqual([]);
		await importButton.click();
		await page.getByLabel('Game notation', { exact: true }).fill('1. Qz9');
		await page.getByRole('button', { name: 'Open game', exact: true }).click();
		await expect(
			page.getByText('That PGN could not be read. Check the move notation and try again.')
		).toBeVisible();
		await page.getByLabel('Game notation', { exact: true }).fill(pgn);
		await page.getByRole('button', { name: 'Open game', exact: true }).click();
		await expect(page.locator('.chessboard')).toBeVisible();
		await expect(page.locator('.move-chip[aria-current="step"]')).toHaveText('Start');
		const gameUrl = page.url();
		const navigation = page.getByRole('navigation', {
			name: viewport.width <= 760 ? 'Mobile navigation' : 'Main navigation'
		});
		await navigation.getByRole('link', { name: 'My games', exact: true }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Take another look.');
		await expect(page.locator('.library-game')).toHaveCount(1);
		await expect(page.locator('.library-game')).toContainText('Ada vs Grace');
		await expect(page.locator('.library-game')).toContainText('White won');
		await expect(page.locator('.library-game')).toContainText('2 moves');
		await expect(importButton).toHaveCount(1);
		await expect(page.locator('.welcome-board')).toHaveCount(0);
		await expect(page.locator('body')).toHaveCSS('overflow', 'visible');
		await page.reload();
		await expect(page.locator('.library-game')).toHaveCount(1);
		await page.screenshot({
			path: `artifacts/app-verification/library-${viewport.width}-${info.project.name}.png`,
			fullPage: true
		});
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await page.locator('.library-game').click();
		await expect(page).toHaveURL(gameUrl);
		await expect(page.locator('.chessboard')).toBeVisible();
		await page.goBack();
		await importButton.click();
		await page.getByLabel('Game notation', { exact: true }).fill(pgn);
		await page.getByRole('button', { name: 'Open game', exact: true }).click();
		await expect(page.locator('.chessboard')).toBeVisible();
		await navigation.getByRole('link', { name: 'My games', exact: true }).click();
		await expect(page.locator('.library-game')).toHaveCount(1);
		expect(errors).toEqual([]);
	});
}

test('legacy demo and invalid saved games are ignored, imports survive and missing links are safe', async ({
	page
}) => {
	await page.addInitScript((pgn) => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([
				{ id: 'opera', pgn: '1. e4 e5 *', addedAt: '1858-11-02' },
				null,
				{ id: 'broken', pgn: 'garbage', addedAt: '2026-11-01' },
				{ id: 'kept', pgn, addedAt: '2026-11-02' }
			])
		);
		localStorage.setItem('upapawn-settings', JSON.stringify({ theme: 'dark', pieceSet: 'custom' }));
	}, pgn);
	await page.goto('/?game=opera');
	await expect(page.getByRole('status')).toHaveText('This game isn’t saved on this device.');
	await expect(page.locator('.library-game')).toHaveCount(1);
	await expect(page.locator('.library-game')).toContainText('Ada vs Grace');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await page.goto('/games');
	await expect(page.locator('.library-game')).toHaveCount(1);
	await page.goto('/?game=unknown');
	await expect(page.locator('.library-game')).toHaveCount(1);
	await page.locator('.library-game').click();
	await expect(page.locator('.chessboard img').first()).toHaveAttribute(
		'src',
		/^\/pieces\/custom\//
	);
});

test('file import opens a review and the library lists newest imports first', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Import your game', exact: true }).click();
	await page.getByRole('tab', { name: 'Upload file', exact: true }).click();
	await page.locator('input[type="file"]').setInputFiles({
		name: 'game.pgn',
		mimeType: 'application/x-chess-pgn',
		buffer: Buffer.from(pgn)
	});
	await page.getByRole('button', { name: 'Open game', exact: true }).click();
	await expect(page.locator('.chessboard')).toBeVisible();
	await page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'My games', exact: true })
		.click();
	await page.getByRole('button', { name: 'Import your game', exact: true }).click();
	await page.getByRole('tab', { name: 'Paste PGN', exact: true }).click();
	await page
		.getByLabel('Game notation', { exact: true })
		.fill('[White "Newest"]\n[Black "Opponent"]\n[Result "0-1"]\n\n1. d4 d5 0-1');
	await page.getByRole('button', { name: 'Open game', exact: true }).click();
	await expect(page.locator('.chessboard')).toBeVisible();
	await page
		.getByRole('navigation', { name: 'Main navigation' })
		.getByRole('link', { name: 'My games', exact: true })
		.click();
	await expect(page.locator('.library-game')).toHaveCount(2);
	await expect(page.locator('.library-game').first()).toContainText('Newest vs Opponent');
	await expect(page.locator('.library-game').first()).toContainText('Black won');
});

test('a large library can be searched and cleared', async ({ page }) => {
	await page.addInitScript(
		(pgn) =>
			localStorage.setItem(
				'upapawn-games',
				JSON.stringify(
					Array.from({ length: 6 }, (_, i) => ({
						id: `game-${i}`,
						pgn: pgn.replace('Ada', `Player ${i}`),
						addedAt: '2026-11-02'
					}))
				)
			),
		pgn
	);
	await page.goto('/');
	await page.getByRole('textbox', { name: 'Search games' }).fill('Player 2');
	await expect(page.locator('.library-game')).toHaveCount(1);
	await page.getByRole('textbox', { name: 'Search games' }).fill('Nobody');
	await expect(page.getByRole('status')).toHaveText('No games found. Clear search');
	await page.getByRole('button', { name: 'Clear search' }).click();
	await expect(page.locator('.library-game')).toHaveCount(6);
});
