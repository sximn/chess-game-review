import { test, expect, type Locator } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

// Measure rendered colors, including translucent surfaces and browser color-mix()
// serialization. A canvas normalizes those colors to sRGB in all three engines.
async function textContrast(text: Locator, surface = text, pseudo?: string) {
	const colors = await surface.evaluate((element) => {
		const layers: string[] = [];
		for (let node: Element | null = element; node; node = node.parentElement)
			layers.unshift(getComputedStyle(node).backgroundColor);
		return layers;
	});
	return text.evaluate(
		(element, { colors, pseudo }) => {
			const canvas = document.createElement('canvas');
			canvas.width = canvas.height = 1;
			const context = canvas.getContext('2d')!;
			context.fillStyle = '#fff';
			context.fillRect(0, 0, 1, 1);
			for (const color of colors) {
				context.fillStyle = color;
				context.fillRect(0, 0, 1, 1);
			}
			const background = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
			const style = getComputedStyle(element, pseudo);
			context.fillStyle = style.color;
			context.globalAlpha = Number(style.opacity);
			context.fillRect(0, 0, 1, 1);
			const foreground = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
			const luminance = (rgb: number[]) =>
				rgb.reduce((sum, channel, index) => {
					const value = channel / 255;
					return (
						sum +
						(value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
							[0.2126, 0.7152, 0.0722][index]
					);
				}, 0);
			const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
			return (high + 0.05) / (low + 0.05);
		},
		{ colors, pseudo }
	);
}

for (const theme of ['light', 'dark'] as const) {
	test(`${theme} semantic colors keep controls readable and preserve fixed artwork`, async ({
		page
	}, info) => {
		await page.setViewportSize({ width: 1440, height: 1000 });
		await page.addInitScript((theme) => {
			localStorage.setItem('upapawn-settings', JSON.stringify({ theme }));
			// The search input appears once the library contains more than five games.
			localStorage.setItem(
				'upapawn-games',
				JSON.stringify(
					Array.from({ length: 6 }, (_, index) => ({
						id: `palette-${index}`,
						pgn: '1. d4 d5 *',
						addedAt: '2026-11-03'
					}))
				)
			);
		}, theme);
		await page.goto('/settings');
		await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
		const activeNav = page.locator('.main-nav a.active');
		expect(await textContrast(activeNav)).toBeGreaterThanOrEqual(4.5);
		expect(await textContrast(page.locator('.app-footer'))).toBeGreaterThanOrEqual(4.5);
		await expect(page.locator('.light-preview')).toHaveCSS(
			'background-color',
			'rgb(243, 239, 226)'
		);
		await expect(page.locator('.dark-preview')).toHaveCSS('background-color', 'rgb(42, 48, 37)');
		await expect(page.locator('.brand-mark').first()).toHaveCSS(
			'background-color',
			'rgb(21, 20, 18)'
		);
		await expect(page.locator('.brand-mark svg path').first()).toHaveAttribute('fill', '#fcc940');
		await page.screenshot({
			path: `artifacts/app-verification/semantic-settings-${theme}-${info.project.name}.png`
		});
		const backdrop = await page.locator('body').evaluate(() => {
			const color = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
			return {
				color,
				meta: document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
			};
		});
		expect(backdrop.meta).toBe(backdrop.color);
		await page
			.getByRole('button', { name: theme === 'light' ? 'Dark' : 'Light', exact: true })
			.click();
		await expect(page.locator('html')).toHaveAttribute(
			'data-theme',
			theme === 'light' ? 'dark' : 'light'
		);
		await expect.poll(() => textContrast(activeNav)).toBeGreaterThanOrEqual(4.5);
		await page
			.getByRole('button', { name: theme === 'light' ? 'Light' : 'Dark', exact: true })
			.click();

		await page
			.getByRole('navigation', { name: 'Main navigation' })
			.getByRole('link', { name: 'My games', exact: true })
			.click();
		await page.getByRole('button', { name: 'Import your game', exact: true }).click();
		const textarea = page.getByLabel('Game notation', { exact: true });
		expect(await textContrast(textarea, textarea, '::placeholder')).toBeGreaterThanOrEqual(4.5);
		const tab = page.getByRole('tab', { selected: true });
		expect(await textContrast(tab, page.locator('.tab-indicator'))).toBeGreaterThanOrEqual(4.5);
		await textarea.fill('1. Qz9');
		await page.getByRole('button', { name: 'Open game', exact: true }).click();
		expect(
			await textContrast(page.locator('.field-message[data-variant="error"]'))
		).toBeGreaterThanOrEqual(4.5);
		await page.screenshot({
			path: `artifacts/app-verification/semantic-import-${theme}-${info.project.name}.png`
		});
		await textarea.fill('1. e4 e5 2. Nf3 Nc6 *');
		await page.getByRole('button', { name: 'Open game', exact: true }).click();
		await expect(page.locator('.chessboard')).toBeVisible();
		await page.getByRole('button', { name: 'Select 1. e4', exact: true }).click();
		const rating = page.locator('.rating-copy strong');
		await expect(rating).toHaveText(/^(Best|Good|Inaccuracy|Mistake|Blunder|Uncertain)$/);
		expect(await textContrast(rating)).toBeGreaterThanOrEqual(4.5);
		expect(await textContrast(page.locator('.move-rating .rating-symbol'))).toBeGreaterThanOrEqual(
			4.5
		);
		const chip = page.locator('.move-chip.current');
		expect(await textContrast(chip)).toBeGreaterThanOrEqual(4.5);
		expect(await textContrast(chip.locator('span'), chip)).toBeGreaterThanOrEqual(4.5);
		const selectedBackground = await chip.evaluate((el) => getComputedStyle(el).backgroundColor);
		await chip.hover();
		await expect(chip).toHaveCSS('background-color', selectedBackground);
		await page.getByRole('tab', { name: 'Moves', exact: true }).click();
		const move = page.locator('.move-pair > button.current');
		expect(await textContrast(move)).toBeGreaterThanOrEqual(4.5);
		const moveBackground = await move.evaluate((el) => getComputedStyle(el).backgroundColor);
		await move.hover();
		await expect(move).toHaveCSS('background-color', moveBackground);
		await page.screenshot({
			path: `artifacts/app-verification/semantic-review-${theme}-${info.project.name}.png`
		});
		await page
			.getByRole('navigation', { name: 'Main navigation' })
			.getByRole('link', { name: 'My games', exact: true })
			.click();
		const search = page.getByRole('textbox', { name: 'Search games', exact: true });
		await expect(search).toBeVisible();
		expect(
			await textContrast(search, page.locator('.input-shell'), '::placeholder')
		).toBeGreaterThanOrEqual(4.5);
	});

	test(`${theme} quality text stays readable on paper, selections, and rating badges`, async ({
		page
	}) => {
		await page.goto('/');
		await page.locator('html').evaluate((root, theme) => {
			(root as HTMLElement).dataset.theme = theme;
		}, theme);
		const qualities = {
			best: '#648c51',
			good: '#648c51',
			inaccuracy: '#b48a00',
			mistake: '#d57824',
			blunder: '#d74442',
			uncertain: '#858c77'
		};
		for (const [quality, marker] of Object.entries(qualities)) {
			for (const background of [
				'var(--paper)',
				'var(--selection-bg)',
				`color-mix(in srgb, ${marker} 12%, var(--paper))`,
				`color-mix(in srgb, ${marker} 20%, var(--paper))`
			]) {
				await page.locator('body').evaluate(
					(body, { quality, background }) => {
						document.getElementById('contrast-probe')?.remove();
						const probe = document.createElement('span');
						probe.id = 'contrast-probe';
						probe.style.color = `var(--quality-${quality}-text)`;
						probe.style.background = background;
						probe.textContent = quality;
						body.append(probe);
					},
					{ quality, background }
				);
				expect(
					await textContrast(page.locator('#contrast-probe')),
					`${quality} on ${background}`
				).toBeGreaterThanOrEqual(4.5);
			}
		}
	});
}
