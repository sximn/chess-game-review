import { test, expect } from '@playwright/test';
import fs from 'node:fs';

// Continuous screencast/snapshots distort this CPU-heavy browser check.
test.use({ trace: { mode: 'retain-on-failure', screenshots: false, snapshots: false } });

test('an 80-ply held-out game completes and persists all 81 positions', async ({ page }, info) => {
	test.setTimeout(600000);
	const game = JSON.parse(fs.readFileSync('tests/fixtures/review-game.json', 'utf8'));
	await page.addInitScript(
		(pgn) =>
			localStorage.setItem(
				'upapawn-games',
				JSON.stringify([{ id: 'long-review', pgn, addedAt: new Date().toISOString() }])
			),
		game.pgn
	);
	await page.setViewportSize({ width: 1440, height: 1000 });
	const started = Date.now();
	await page.goto('/?game=long-review');
	await expect(page.getByText('81 / 81 positions', { exact: true })).toBeVisible({
		timeout: 240000
	});
	const allPositionsScoredMs = Date.now() - started;
	// This is a worst-case random-move stress game with many real mistakes; record
	// latency rather than treating the functional timeout as a release performance gate.
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 480000 });
	const records = await page.evaluate(
		() =>
			new Promise<number>((resolve, reject) => {
				const open = indexedDB.open('upapawn-analysis-v2');
				open.onerror = () => reject(open.error);
				open.onsuccess = () => {
					const db = open.result;
					const count = db.transaction('results').objectStore('results').count();
					count.onsuccess = () => {
						resolve(count.result);
						db.close();
					};
				};
			})
	);
	expect(records).toBeGreaterThanOrEqual(81);
	fs.writeFileSync(
		`artifacts/app-verification/whole-game-${info.project.name}.json`,
		JSON.stringify(
			{
				gameId: game.id,
				plies: 80,
				elapsedMs: Date.now() - started,
				allPositionsScoredMs,
				persistedRecords: records,
				budget: { nodes: 30000, timeCapMs: 750 },
				limitation:
					'One exploratory desktop game, including classifications/refinements; quality budget remains provisional.'
			},
			null,
			2
		)
	);
});
