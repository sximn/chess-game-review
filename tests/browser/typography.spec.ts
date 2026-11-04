import { test, expect, type Locator } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });
const numberStyle = (locator: Locator, property: string) =>
	locator.evaluate(
		(element, property) => parseFloat(getComputedStyle(element).getPropertyValue(property)),
		property
	);

test('text roles respect font preferences and mobile notation keeps its minimum size', async ({
	page
}, info) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/settings');
	const heading = page.locator('.page-heading h1');
	await expect(heading).toHaveCSS('font-family', /DM Sans Variable/);
	await expect(page.locator('.settings-content h2').first()).toHaveCSS(
		'font-family',
		/DM Serif Display/
	);
	const original = await numberStyle(heading, 'font-size');
	const rootSize = await numberStyle(page.locator('html'), 'font-size');
	await page.locator('html').evaluate((root) => {
		(root as HTMLElement).style.fontSize = '125%';
	});
	await expect
		.poll(() => numberStyle(page.locator('html'), 'font-size'))
		.toBeCloseTo(rootSize * 1.25, 1);
	await expect.poll(() => numberStyle(heading, 'font-size')).toBeCloseTo(original * 1.25, 1);
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

	await page
		.getByRole('navigation', { name: 'Mobile navigation' })
		.getByRole('link', { name: 'My games', exact: true })
		.click();
	await page.getByRole('button', { name: 'Import your game', exact: true }).click();
	const notation = page.getByLabel('Game notation', { exact: true });
	await expect(notation).toHaveCSS('font-family', /monospace/);
	await expect(page.locator('.dialog-title')).toHaveCSS('font-family', /DM Serif Display/);
	expect(await numberStyle(notation, 'font-size')).toBeGreaterThanOrEqual(20);
	const sheet = page.locator('.dialog-content');
	expect(await numberStyle(sheet, 'border-top-left-radius')).toBeGreaterThan(
		await numberStyle(notation, 'border-top-left-radius')
	);
	await expect(sheet).toHaveCSS('border-bottom-left-radius', '0px');
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
	await page.screenshot({
		path: `artifacts/app-verification/typography-large-text-${info.project.name}.png`
	});

	await page.locator('html').evaluate((root) => {
		(root as HTMLElement).style.fontSize = '75%';
	});
	expect(await numberStyle(notation, 'font-size')).toBeGreaterThanOrEqual(16);
});

test('compact review cards share corners while board labels keep their spatial sizing', async ({
	page
}, info) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.addInitScript(() => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([{ id: 'type-review', pgn: '1. e4 e5 2. Ba6 Nxa6 *', addedAt: '2026-11-03' }])
		);
	});
	await page.goto('/?game=type-review');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await page.getByRole('button', { name: 'Select 2. Ba6', exact: true }).click();
	const rating = page.locator('.move-rating');
	const best = page.locator('.best-move-card');
	await expect(best).toBeVisible();
	const radius = await numberStyle(rating, 'border-top-left-radius');
	expect(await numberStyle(best, 'border-top-left-radius')).toBe(radius);
	expect(await numberStyle(page.locator('.best-move-trigger'), 'border-top-left-radius')).toBe(
		radius
	);
	expect(await numberStyle(page.locator('.review-tabs'), 'border-top-left-radius')).toBeGreaterThan(
		radius
	);

	const coordinate = page.locator('.rank-label').first();
	const coordinateSize = await numberStyle(coordinate, 'font-size');
	const brandSize = await numberStyle(page.locator('.brand'), 'font-size');
	await page.locator('html').evaluate((root) => {
		(root as HTMLElement).style.fontSize = '125%';
	});
	expect(await numberStyle(coordinate, 'font-size')).toBe(coordinateSize);
	expect(await numberStyle(page.locator('.brand'), 'font-size')).toBe(brandSize);
	await page.locator('html').evaluate((root) => {
		(root as HTMLElement).style.fontSize = '';
	});
	for (const viewport of [
		{ width: 1440, height: 1000 },
		{ width: 320, height: 568 },
		{ width: 568, height: 320 }
	]) {
		await page.setViewportSize(viewport);
		await expect(page.getByRole('button', { name: 'Next move', exact: true })).toBeInViewport();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
			true
		);
		await page.screenshot({
			path: `artifacts/app-verification/typography-review-${viewport.width}-${info.project.name}.png`
		});
	}
});
