import { test, expect, type Page } from '@playwright/test';

async function openRatedMove(page: Page) {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.addInitScript(() => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([
				{ id: 'rating-reveal', pgn: '1. e4 e5 2. Nf3 Nc6 *', addedAt: new Date().toISOString() }
			])
		);
	});
	await page.goto('/?game=rating-reveal');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await page.getByRole('button', { name: 'Select 2. Nf3', exact: true }).click();
	await expect(page.locator('.move-rating strong')).toHaveText(
		/Best|Good|Inaccuracy|Mistake|Blunder|Uncertain/
	);
}

test('rating expands a best-move preview, rotates its arrow and restores the played position', async ({
	page
}) => {
	await openRatedMove(page);
	const board = page.locator('.chessboard');
	const rating = page.locator('.rating-content');
	const current = page.locator('.move-chip[aria-current="step"]');
	await expect(board).toHaveAttribute('aria-label', /Black to move/);
	await rating.click();
	await expect(rating).toHaveAttribute('aria-expanded', 'true');
	await expect(page.locator('.move-comparison')).toBeVisible();
	await expect(board).toHaveAttribute('aria-label', /White to move/);
	await expect(board.getByRole('img', { name: 'White knight on g1', exact: true })).toBeVisible();
	await expect(current).toHaveText('2.Nf3');
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
	await expect(rating).toHaveAttribute('aria-expanded', 'false');
	await rating.click();
	await page.getByRole('button', { name: 'Next move', exact: true }).click();
	await expect(arrow).toHaveCount(0);
	await expect(rating).toHaveAttribute('aria-expanded', 'false');
	await page.setViewportSize({ width: 390, height: 844 });
	await rating.click();
	await expect(arrow).toBeVisible();
	await page.getByRole('button', { name: 'Analysis', exact: true }).click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(arrow).toHaveCount(0);
	await page.keyboard.press('Escape');
	await rating.click();
	await page.getByRole('button', { name: 'Explore line', exact: true }).click();
	await expect(page.getByText('Exploring an alternative', { exact: true })).toBeVisible();
	await expect(arrow).toHaveCount(0);
	await expect(page.locator('.move-rating strong')).toHaveText('Alternative line');
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
	await page.getByRole('button', { name: 'Select 2. Nf3', exact: true }).click();
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
