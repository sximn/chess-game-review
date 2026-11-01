import { test, expect, type Page } from '@playwright/test';

async function openRatedMove(page: Page) {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.addInitScript(() => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([
				{ id: 'rating-reveal', pgn: '1. e4 e5 2. Ba6 Nxa6 *', addedAt: new Date().toISOString() }
			])
		);
	});
	await page.goto('/?game=rating-reveal');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await page.getByRole('button', { name: 'Select 2. Ba6', exact: true }).click();
	await expect(page.locator('.move-rating strong')).toHaveText(
		/Best|Good|Inaccuracy|Mistake|Blunder|Uncertain/
	);
}

test('move cards show the rating and alternative immediately, and only the best card reveals exploration', async ({
	page
}) => {
	await openRatedMove(page);
	const board = page.locator('.chessboard');
	const rating = page.locator('.move-rating');
	const bestCard = page.locator('.best-move-card');
	const bestMove = page.locator('.best-move-trigger');
	const current = page.locator('.move-chip[aria-current="step"]');
	await expect(board).toHaveAttribute('aria-label', /Black to move/);
	await expect(rating).toHaveAttribute('data-variant', 'paper');
	await expect(rating).toContainText('2. Ba6');
	await expect(rating.locator('button')).toHaveCount(0);
	await expect(bestCard).toHaveAttribute('data-variant', 'paper');
	await expect(bestCard).toBeVisible();
	await expect(bestCard.locator('strong')).not.toHaveText('Ba6');
	await expect(page.getByRole('button', { name: 'Explore line', exact: true })).toHaveCount(0);
	await expect(page.locator('.suggestion-arrow')).toHaveCount(0);
	await rating.click();
	await expect(page.getByRole('button', { name: 'Explore line', exact: true })).toHaveCount(0);
	await bestMove.click();
	await expect(bestMove).toHaveAttribute('aria-expanded', 'true');
	await expect(page.getByRole('button', { name: 'Explore line', exact: true })).toBeVisible();
	await expect(board).toHaveAttribute('aria-label', /White to move/);
	await expect(board.getByRole('img', { name: 'White bishop on f1', exact: true })).toBeVisible();
	await expect(current).toHaveText('2.Ba6');
	await expect(page.getByRole('dialog')).not.toBeVisible();
	const arrow = page.locator('.suggestion-arrow');
	await expect(arrow).toBeVisible();
	const from = await arrow.getAttribute('data-from');
	await expect(board.locator(`[role="gridcell"][id$="-${from}"]`)).not.toHaveAttribute(
		'aria-label',
		/empty/
	);
	const originalPath = await arrow.locator('.suggestion-path').getAttribute('d');
	await page.getByRole('button', { name: 'Flip board', exact: true }).click();
	await expect(arrow.locator('.suggestion-path')).not.toHaveAttribute('d', originalPath!);
	await page.keyboard.press('Escape');
	await expect(arrow).toHaveCount(0);
	await expect(board).toHaveAttribute('aria-label', /Black to move/);
	await expect(bestMove).toHaveAttribute('aria-expanded', 'false');
	await expect(page.getByRole('button', { name: 'Explore line', exact: true })).toHaveCount(0);
	await bestMove.click();
	await page.getByRole('button', { name: 'Next move', exact: true }).click();
	await expect(arrow).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Explore line', exact: true })).toHaveCount(0);
	await page.getByRole('button', { name: 'Previous move', exact: true }).click();
	await expect(bestMove).toHaveAttribute('aria-expanded', 'false');
	await page.setViewportSize({ width: 390, height: 844 });
	await bestMove.click();
	await expect(arrow).toBeVisible();
	await page.getByRole('button', { name: 'Analysis', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(arrow).toHaveCount(0);
	await page.keyboard.press('Escape');
	await bestMove.click();
	await page.getByRole('button', { name: 'Explore line', exact: true }).click();
	await expect(page.getByText('Exploring an alternative', { exact: true })).toBeVisible();
	await expect(arrow).toHaveCount(0);
	await expect(page.locator('.move-rating strong')).toHaveText('Alternative line');
	await expect(bestCard).toHaveCount(0);
});

test('ratings stay left and playback stays right without layout shifts while stepping', async ({
	page
}) => {
	await openRatedMove(page);
	for (const viewport of [
		{ width: 1440, height: 1000 },
		{ width: 1024, height: 768 },
		{ width: 390, height: 844 },
		{ width: 320, height: 568 },
		{ width: 568, height: 320 }
	]) {
		await page.setViewportSize(viewport);
		await expect(page.locator('.review-layout')).toHaveClass(
			viewport.width >= 1200 ? /^(?!.*compact-review)/ : /compact-review/
		);
		const samples = [];
		for (let ply = 0; ply <= 4; ply++) {
			await page.locator('.move-chip').nth(ply).click();
			await expect(page.locator('.move-chip').nth(ply)).toHaveAttribute('aria-current', 'step');
			const sample = await page.evaluate(() => {
				const rect = (selector: string) => {
					const r = document.querySelector(selector)!.getBoundingClientRect();
					return {
						left: r.left,
						top: r.top,
						width: r.width,
						height: r.height,
						right: r.right,
						bottom: r.bottom
					};
				};
				return {
					rating: rect('.move-rating'),
					playback: rect('.playback-controls'),
					actions: rect('.replay-actions'),
					utilities: rect('.replay-utilities'),
					steps: rect('.step-controls'),
					board: rect('.chessboard'),
					overflow: document.documentElement.scrollWidth > innerWidth
				};
			});
			expect(Math.abs(sample.rating.left - sample.utilities.left)).toBeLessThan(1);
			expect(Math.abs(sample.actions.right - sample.utilities.right)).toBeLessThan(1);
			expect(sample.actions.left).toBeGreaterThanOrEqual(0);
			expect(sample.actions.right).toBeLessThanOrEqual(viewport.width);
			expect(sample.steps.bottom).toBeLessThanOrEqual(viewport.height);
			expect(sample.overflow).toBe(false);
			samples.push(sample);
		}
		for (const sample of samples.slice(1)) {
			for (const element of ['rating', 'playback', 'steps', 'board'] as const) {
				for (const dimension of ['left', 'top', 'width', 'height'] as const) {
					expect(
						Math.abs(sample[element][dimension] - samples[0][element][dimension]),
						`${viewport.width}px ${element} ${dimension}`
					).toBeLessThan(1);
				}
			}
		}
	}
});

test('the best-move card is absent at the start and when the played move is already best', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.addInitScript(() => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([
				{
					id: 'only-legal-move',
					pgn: '[SetUp "1"]\n[FEN "r7/8/8/8/8/2k5/8/K7 w - - 0 1"]\n\n1. Kb1 *',
					addedAt: new Date().toISOString()
				}
			])
		);
	});
	await page.goto('/?game=only-legal-move');
	await expect(page.locator('.move-rating strong')).toHaveText('Starting position');
	await expect(page.locator('.best-move-card')).toHaveCount(0);
	await page.getByRole('button', { name: 'Analysis', exact: true }).click();
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Next move', exact: true }).click();
	await expect(page.locator('.move-rating strong')).toHaveText('Best');
	await expect(page.locator('.move-rating')).toContainText('1. Kb1');
	await expect(page.locator('.best-move-card')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Explore line', exact: true })).toHaveCount(0);
});

test('technical analysis labels appear only with analysis=detail', async ({ page }) => {
	await openRatedMove(page);
	await expect(page.locator('.move-rating')).not.toContainText(/Preliminary|Refined/);
	await expect(page.locator('.played-quality')).not.toContainText(
		/Preliminary|Refined|depths|measured loss/
	);
	await expect(page.locator('.engine-lines')).not.toContainText(/depth|nodes|Budget reached/);
	await page.getByRole('tab', { name: 'Moves', exact: true }).click();
	await expect(page.locator('.moves-list [title]').first()).not.toHaveAttribute(
		'title',
		/Preliminary|Refined/
	);
	await page.goto('/?game=rating-reveal&analysis=detail');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await page.getByRole('button', { name: 'Select 2. Ba6', exact: true }).click();
	await expect(page.locator('.move-rating')).toContainText(/Preliminary|Refined/);
	await expect(page.locator('.played-quality')).toContainText(/depths/);
	await expect(page.locator('.played-quality')).toContainText(/cp measured loss/);
	await expect(page.locator('.engine-lines')).toContainText(/depth/);
	await page.getByRole('tab', { name: 'Moves', exact: true }).click();
	await expect(page.locator('.moves-list [title]').first()).toHaveAttribute(
		'title',
		/Preliminary|Refined/
	);
});
