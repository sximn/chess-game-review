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

test('best-line steps reveal on demand and stay independent of game navigation', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await openRatedMove(page);
	const board = page.locator('.chessboard');
	const rating = page.locator('.move-rating');
	const bestCard = page.locator('.best-move-card');
	const bestMove = page.locator('.best-move-trigger');
	const current = page.locator('.move-chip[aria-current="step"]');
	const steps = page.getByRole('group', { name: 'Alternative move timeline', exact: true });
	const badge = page.locator('.variation-badge');
	const originalChips = await page.locator('.move-chip').allTextContents();
	await expect(board).toHaveAttribute('aria-label', /Black to move/);
	await expect(rating).toContainText('2. Ba6');
	await expect(rating.locator('button')).toHaveCount(0);
	await expect(bestCard).toBeVisible();
	await expect(bestCard.locator('strong')).toHaveText('Best move');
	await expect(steps).not.toBeVisible();
	await expect(page.locator('.variation-slot')).toHaveCSS('height', '0px');
	await expect(page.getByRole('button', { name: 'Explore line', exact: true })).toHaveCount(0);
	await expect(page.locator('.suggestion-arrow')).toHaveCount(0);
	await bestMove.click();
	await expect(bestMove).toHaveAttribute('aria-pressed', 'true');
	await expect(bestMove).toHaveAttribute('aria-expanded', 'true');
	await expect(steps).toBeVisible();
	expect(await steps.getByRole('button').count()).toBeGreaterThan(2);
	await expect(board).toHaveAttribute('aria-label', /White to move/);
	await expect(board.getByRole('img', { name: 'White bishop on f1', exact: true })).toBeVisible();
	await expect(current).toHaveText('2.Ba6');
	const arrow = page.locator('.suggestion-arrow');
	await expect(arrow).toBeVisible();
	const originalPath = await arrow.locator('.suggestion-path').getAttribute('d');
	await page.getByRole('button', { name: 'Flip board', exact: true }).click();
	await expect(arrow.locator('.suggestion-path')).not.toHaveAttribute('d', originalPath!);
	await page.keyboard.press('Escape');
	await expect(arrow).toHaveCount(0);
	await expect(board).toHaveAttribute('aria-label', /Black to move/);
	await expect(bestMove).toHaveAttribute('aria-pressed', 'false');
	await expect(steps).not.toBeVisible();
	await expect(page.locator('.variation-slot')).toHaveCSS('height', '0px');
	await bestMove.click();

	// Variation navigation keeps the revealed list open without changing the game cursor.
	await steps.getByRole('button').nth(2).click();
	await expect(badge).toBeVisible();
	await expect(steps.getByRole('button').nth(2)).toHaveAttribute('aria-current', 'step');
	await expect(board).toHaveAttribute('aria-label', /White to move/);
	await expect(current).toHaveText('2.Ba6');
	await expect(rating).toContainText('2. Ba6');
	expect(await page.locator('.move-chip').allTextContents()).toEqual(originalChips);
	await expect(page.getByRole('button', { name: 'Return to game', exact: true })).toHaveCount(0);
	await steps.getByRole('button').nth(1).click();
	await expect(board).toHaveAttribute('aria-label', /Black to move/);
	await steps.getByRole('button', { name: 'Alternative starting position', exact: true }).click();
	await expect(board.getByRole('img', { name: 'White bishop on f1', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Next move', exact: true }).click();
	await expect(badge).toHaveCount(0);
	await expect(current).toHaveText('2…Nxa6');
	await expect(board.getByRole('img', { name: 'Black knight on a6', exact: true })).toBeVisible();

	await page.getByRole('button', { name: 'Previous move', exact: true }).click();
	await bestMove.click();
	await steps.getByRole('button').nth(1).click();
	await page.keyboard.press('ArrowLeft');
	await expect(current).toHaveText('1…e5');
	await expect(badge).toHaveCount(0);
	await page.getByRole('button', { name: 'Select 2. Ba6', exact: true }).click();
	await bestMove.click();
	await steps.getByRole('button').nth(1).click();
	await page.getByRole('button', { name: 'Select 2. Ba6', exact: true }).click();
	await expect(badge).toHaveCount(0);
	await expect(board.getByRole('img', { name: 'White bishop on a6', exact: true })).toBeVisible();
	await bestMove.click();
	await steps.getByRole('button').nth(1).click();
	await page.getByRole('button', { name: 'Play replay', exact: true }).click();
	await expect(badge).toHaveCount(0);
	await expect(current).toHaveText('2…Nxa6');

	await page.getByRole('button', { name: 'Select 2. Ba6', exact: true }).click();
	await page.setViewportSize({ width: 390, height: 844 });
	await bestMove.click();
	await expect(arrow).toBeVisible();
	await page.getByRole('button', { name: 'Analysis', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(arrow).toHaveCount(0);
	await page.keyboard.press('Escape');
	await bestMove.click();
	await steps.getByRole('button').nth(2).click();
	await expect(badge).toBeVisible();
	await expect(current).toHaveText('2.Ba6');
	await expect(steps.getByRole('button').nth(2)).toBeInViewport();
	await page.getByRole('button', { name: 'Next move', exact: true }).click();
	await expect(badge).toHaveCount(0);
	await expect(current).toHaveText('2…Nxa6');
	expect(errors).toEqual([]);
});

test('game navigation exits variations at both ends of the game', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.addInitScript(() => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([
				{ id: 'variation-end', pgn: '1. e4 e5 2. Ba6 *', addedAt: new Date().toISOString() }
			])
		);
	});
	await page.goto('/?game=variation-end');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	const current = page.locator('.move-chip[aria-current="step"]');
	const badge = page.locator('.variation-badge');
	await page.getByRole('button', { name: 'Explore alternative 1', exact: true }).click();
	await expect(current).toHaveText('Start');
	await expect(badge).toBeVisible();
	await page.getByRole('button', { name: 'Previous move', exact: true }).click();
	await expect(badge).toHaveCount(0);
	await expect(current).toHaveText('Start');
	await page.getByRole('button', { name: 'Select 2. Ba6', exact: true }).click();
	await page.locator('.best-move-trigger').click();
	await expect(page.locator('.variation-step').nth(1)).toBeVisible();
	await page.locator('.variation-step').nth(1).click();
	await expect(badge).toBeVisible();
	await page.getByRole('button', { name: 'Next move', exact: true }).click();
	await expect(badge).toHaveCount(0);
	await expect(current).toHaveText('2.Ba6');
	await expect(page.getByRole('button', { name: 'Next move', exact: true })).toBeDisabled();
});

test('alternative timeline combines dimming and a frame on desktop and mobile', async ({
	page
}, info) => {
	await openRatedMove(page);
	await page.locator('.best-move-trigger').click();
	await page.locator('.variation-step').nth(2).click();
	await expect(page.locator('.position-frame')).toHaveClass(/exploring/);
	for (const viewport of [
		{ width: 1440, height: 1000 },
		{ width: 390, height: 844 },
		{ width: 320, height: 568 },
		{ width: 568, height: 320 }
	]) {
		await page.setViewportSize(viewport);
		await expect(page.locator('.variation-badge')).toBeVisible();
		expect(
			await page
				.locator('.best-move-copy strong')
				.evaluate((label) => label.scrollWidth <= label.clientWidth)
		).toBe(true);
		await expect(page.locator('.variation-step[aria-current="step"]')).toBeInViewport();
		const board = (await page.locator('.chessboard').boundingBox())!;
		expect(board.height).toBeGreaterThan(viewport.width < 480 ? 200 : 100);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await expect(page.getByRole('button', { name: 'Next move', exact: true })).toBeInViewport();
		await page.screenshot({
			path: `artifacts/app-verification/variation-${viewport.width}-${info.project.name}.png`,
			fullPage: true
		});
	}
});

test('revealing a best line lifts the controls without reserving space and respects reduced motion', async ({
	page
}, info) => {
	await openRatedMove(page);
	const slot = page.locator('.variation-slot');
	const bestMove = page.locator('.best-move-trigger');
	for (const viewport of [
		{ width: 1440, height: 1000 },
		{ width: 390, height: 844 },
		{ width: 320, height: 568 },
		{ width: 568, height: 320 }
	]) {
		await page.setViewportSize(viewport);
		// Chromium can report the resized viewport before dynamic viewport units update.
		await expect
			.poll(async () => (await page.locator('.review-route').boundingBox())!.height)
			.toBe(viewport.height);
		for (const reducedMotion of ['no-preference', 'reduce'] as const) {
			await page.emulateMedia({ reducedMotion });
			await expect(slot).toHaveCSS('height', '0px');
			const utilitiesBefore = (await page.locator('.replay-utilities').boundingBox())!;
			const stepperBefore = (await page.locator('.step-controls').boundingBox())!;
			await bestMove.click();
			await expect(bestMove).toHaveAttribute('aria-expanded', 'true');
			await expect
				.poll(async () => (await page.locator('.replay-utilities').boundingBox())!.y)
				.toBeLessThan(utilitiesBefore.y - 40);
			await expect(page.getByRole('button', { name: 'Next move', exact: true })).toBeInViewport();
			expect(
				Math.abs((await page.locator('.step-controls').boundingBox())!.y - stepperBefore.y)
			).toBeLessThan(1);
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
				true
			);
			await page.screenshot({
				path: `artifacts/app-verification/variation-reveal-${viewport.width}-${reducedMotion}-${info.project.name}.png`,
				fullPage: true
			});
			await bestMove.click();
			await expect(bestMove).toHaveAttribute('aria-expanded', 'false');
			await expect(slot).toHaveCSS('height', '0px');
			expect(
				Math.abs((await page.locator('.replay-utilities').boundingBox())!.y - utilitiesBefore.y)
			).toBeLessThan(1);
		}
	}
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
