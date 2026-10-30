import { test, expect } from '@playwright/test';

test('piece sets persist and every custom piece renders on the board', async ({ page }, info) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/settings');
	await page.evaluate(() => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([{ id: 'pieces', pgn: '1. e4 e5 *', addedAt: '2026-10-30' }])
		);
	});
	const choices = page.getByRole('group', { name: 'Piece set', exact: true });
	await expect(choices.getByRole('button', { name: 'Classic', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await choices.getByRole('button', { name: 'Custom', exact: true }).click();
	await expect(choices.getByRole('button', { name: 'Custom', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect
		.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('upapawn-settings')!).pieceSet))
		.toBe('custom');
	await page.reload();
	await expect(choices.getByRole('button', { name: 'Custom', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.screenshot({
		path: `artifacts/app-verification/pieces-settings-${info.project.name}.png`,
		fullPage: true
	});

	await page.goto('/?game=pieces');
	const pieces = page.locator('.chessboard img');
	await expect(pieces).toHaveCount(32);
	await expect
		.poll(() =>
			pieces.evaluateAll((images) =>
				images.every((image) => {
					const img = image as HTMLImageElement;
					return (
						img.getAttribute('src')?.startsWith('/pieces/custom/') &&
						img.complete &&
						img.naturalWidth > 0
					);
				})
			)
		)
		.toBe(true);
	expect(
		await pieces.evaluateAll(
			(images) => new Set(images.map((image) => image.getAttribute('src'))).size
		)
	).toBe(12);
	await page.screenshot({
		path: `artifacts/app-verification/pieces-board-${info.project.name}.png`,
		fullPage: true
	});

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/settings');
	await choices.getByRole('button', { name: 'Classic', exact: true }).click();
	await expect(choices.getByRole('button', { name: 'Classic', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page.screenshot({
		path: `artifacts/app-verification/pieces-mobile-${info.project.name}.png`,
		fullPage: true
	});
	await page.goto('/?game=pieces');
	await expect(page.locator('.chessboard img').first()).toHaveAttribute(
		'src',
		/^\/pieces\/[wb][KQRBNP]\.svg$/
	);
});

test('unknown piece preferences fall back to Classic', async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem(
			'upapawn-settings',
			JSON.stringify({ pieceSet: 'unknown', theme: 'dark' })
		);
	});
	await page.goto('/settings');
	await expect(
		page
			.getByRole('group', { name: 'Piece set', exact: true })
			.getByRole('button', { name: 'Classic', exact: true })
	).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
