import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('real WASM lifecycle: 100 cancel/restart/reset/dispose cycles without stale results', async ({
	page
}, info) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('/diagnostics');
	await page.getByRole('button', { name: 'Run local diagnostics' }).click();
	await expect(page.getByRole('status')).toHaveText('All local checks passed', { timeout: 110000 });
	const result = JSON.parse((await page.getByTestId('diagnostics-results').textContent())!);
	expect(result.cycles).toBe(100);
	expect(result.terminalEvents).toBe(200);
	expect(result.staleUpdates).toBe(0);
	expect(result.sharedMemory).toBe(false);
	expect(result.peakObservedMemoryBytes).toBeLessThanOrEqual(256 * 1024 * 1024);
	expect(result.cancellationAckMs.p95).toBeLessThan(250);
	expect(result.replacementResultMs.p95).toBeLessThan(500);
	expect(errors).toEqual([]);
	fs.writeFileSync(
		`artifacts/frozenight/lifecycle-${info.project.name}.json`,
		JSON.stringify(result, null, 2)
	);
});

test('game review displays real alternatives, replays a branch, and keeps score sign on flip', async ({
	page
}, info) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Explore alternative 1' })).toBeVisible();
	// Freeze iterative evaluation so a deeper result cannot race the flip assertion.
	await page.getByRole('button', { name: 'Pause review' }).click();
	await expect(page.getByRole('button', { name: 'Resume review' })).toBeVisible();
	const rail = page.locator('.evaluation-rail');
	const before = await rail.getAttribute('aria-label');
	expect(before).not.toContain('unavailable');
	await page.getByRole('button', { name: /Flip board/i }).click();
	expect(await rail.getAttribute('aria-label')).toBe(before);
	await page.getByRole('button', { name: 'Explore alternative 1' }).click();
	await expect(page.getByText('Exploring an alternative')).toBeVisible();
	await page.getByRole('button', { name: 'Return to game' }).click();
	await expect(page.getByText('Exploring an alternative')).not.toBeVisible();
	await page.getByRole('tab', { name: 'Moves', exact: true }).click();
	await expect(page.locator('.move-pair')).toHaveCount(17);
	await page.getByRole('tab', { name: 'Evaluation', exact: true }).click();
	await expect(page.getByRole('region', { name: 'Evaluation timeline' })).toBeVisible();
	await page.screenshot({
		path: `artifacts/frozenight/review-${info.project.name}.png`,
		fullPage: true
	});
	expect(errors).toEqual([]);
});

test('mobile layout stays interactive during local analysis', async ({ page }, info) => {
	await page.setViewportSize({ width: 390, height: 844 });
	// Capacitor can launch the SPA fallback by its filename.
	await page.goto('/index.html');
	await expect(page.locator('.chessboard')).toBeVisible();
	expect((await page.locator('.chessboard').boundingBox())!.height).toBeGreaterThan(200);
	await page.keyboard.press('ArrowRight');
	await page.getByRole('button', { name: /analysis/i }).click();
	await expect(page.getByRole('button', { name: 'Explore alternative 1' })).toBeVisible();
	await page.screenshot({
		path: `artifacts/frozenight/mobile-${info.project.name}.png`,
		fullPage: true
	});
	expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('offline reload reviews a different PGN without a successful network request', async ({
	page,
	context
}, info) => {
	// Playwright WebKit kills SW-handled requests before dispatch when setOffline is true:
	// https://github.com/microsoft/playwright/issues/42775 . Shut down an isolated origin instead.
	let origin = 'http://localhost:4173';
	let server: ReturnType<typeof spawn> | undefined;
	if (info.project.name === 'webkit') {
		origin = 'http://localhost:4174';
		server = spawn(process.execPath, ['scripts/serve-build.mjs', '--port', '4174']);
		const cleanup = () => {
			server?.kill();
		};
		page.on('close', cleanup);
		await once(server.stdout!, 'data');
	}
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto(origin + '/');
	await expect(page.getByRole('button', { name: 'Explore alternative 1' })).toBeVisible();
	await page.evaluate(() =>
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([
				{ id: 'online-game', pgn: '1. e4 e5 2. Nf3 Nc6 *', addedAt: new Date().toISOString() }
			])
		)
	);
	await page.goto(origin + '/?game=online-game');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
		await new Promise<void>((resolve) => {
			if (navigator.serviceWorker.controller) resolve();
			else
				navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), {
					once: true
				});
		});
	});
	const pgn = '[White "Offline Ada"]\n[Black "Offline Grace"]\n\n1. d4 d5 2. c4 e6 3. Nc3 Nf6 *';
	await page.evaluate((pgn) => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([{ id: 'offline-game', pgn, addedAt: new Date().toISOString() }])
		);
	}, pgn);
	if (server) {
		server.kill();
		await once(server, 'exit');
		await expect(fetch(origin)).rejects.toThrow();
	} else await context.setOffline(true);
	const successful: string[] = [];
	const cachedResponses: string[] = [];
	page.on('response', (r) => {
		if (r.ok() && !r.fromServiceWorker()) {
			// WebKit reports HTTP/memory cache responses without a SW flag. The isolated
			// origin is stopped and a separate fetch has already proved it unreachable.
			if (server) cachedResponses.push(r.url());
			else successful.push(r.url());
		}
	});
	await page.goto(origin + '/?game=offline-game');
	await expect(page.getByText('Offline Ada', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await expect(page.getByRole('button', { name: 'Explore alternative 1' })).toBeVisible();
	expect(successful).toEqual([]);
	fs.writeFileSync(
		`artifacts/frozenight/offline-${info.project.name}.json`,
		JSON.stringify(
			{
				differentPgn: true,
				outage: server ? 'origin-server-stopped' : 'browser-offline-emulation',
				reviewCompleted: true,
				successfulNetworkResponses: successful,
				cachedResponsesWithoutServiceWorkerFlag: cachedResponses,
				originProvenUnreachable: !!server,
				userAgent: await page.evaluate(() => navigator.userAgent)
			},
			null,
			2
		)
	);
});

test('a corrupt downloaded asset is rejected, then retry recovers', async ({ browser }) => {
	const context = await browser.newContext({ serviceWorkers: 'block' });
	const page = await context.newPage();
	await context.route('**/engine-*.wasm', (route) =>
		route.fulfill({ status: 200, contentType: 'application/wasm', body: 'corrupt asset' })
	);
	await page.goto('/diagnostics');
	await page.getByRole('button', { name: 'Run local diagnostics' }).click();
	await expect(page.getByRole('status')).toContainText('integrity check');
	await context.unroute('**/engine-*.wasm');
	await page.getByRole('button', { name: 'Run local diagnostics' }).click();
	await expect(page.getByRole('status')).toHaveText('All local checks passed', { timeout: 110000 });
	await context.close();
});

test('storage quota errors remain recoverable and hiding pauses review', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.addInitScript(() => {
		localStorage.setItem(
			'upapawn-games',
			JSON.stringify([
				{ id: 'quota', pgn: '1. e4 e5 2. Nf3 Nc6 *', addedAt: new Date().toISOString() }
			])
		);
		IDBObjectStore.prototype.put = function () {
			throw new DOMException('Storage quota exhausted', 'QuotaExceededError');
		};
	});
	await page.goto('/?game=quota');
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await expect(
		page.getByText('Device storage is full; new results are kept for this session.', {
			exact: true
		})
	).toBeVisible();
	await page.evaluate(() => {
		Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
		document.dispatchEvent(new Event('visibilitychange'));
	});
	await expect(page.getByRole('button', { name: 'Resume review' })).toBeVisible();
	await page.evaluate(() => {
		Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
		document.dispatchEvent(new Event('visibilitychange'));
	});
	await expect(page.getByRole('button', { name: 'Explore alternative 1' })).toBeVisible();
});

test('an 80-ply held-out game completes and persists all 81 positions', async ({ page }, info) => {
	test.setTimeout(600000);
	const corpus = JSON.parse(fs.readFileSync('tests/fixtures/engine-corpus.json', 'utf8'));
	const game = corpus.games.find(
		(g: { partition: string; plies: number }) => g.partition === 'held-out' && g.plies === 80
	);
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
				const open = indexedDB.open('upapawn-analysis-v1');
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
		`artifacts/frozenight/whole-game-${info.project.name}.json`,
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

test('mobile PGN import opens a fresh local review without shrinking the board', async ({
	page
}, info) => {
	const unexpected: string[] = [];
	page.on('request', (r) => {
		if (
			!['GET', 'HEAD'].includes(r.method()) ||
			(r.url().startsWith('http') && new URL(r.url()).origin !== 'http://localhost:4173') ||
			r.url().includes('Mobile%20Ada') ||
			r.postData()
		)
			unexpected.push(r.url());
	});
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	await page
		.getByRole('navigation', { name: 'Mobile navigation' })
		.getByRole('button', { name: 'Import', exact: true })
		.click();
	const input = page.getByLabel('Game notation', { exact: true });
	await expect(input).toHaveAttribute('autocapitalize', 'off');
	await expect(input).toHaveAttribute('autocorrect', 'off');
	await input.fill(
		'[White "Mobile Ada"]\n[Black "Mobile Grace"]\n\n1. d4 d5 2. c4 e6 3. Nc3 Nf6 *'
	);
	expect(
		await input.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
	).toBeGreaterThanOrEqual(16);
	await page.getByRole('button', { name: 'Open game', exact: true }).click();
	await expect(page.getByText('Mobile Ada', { exact: true }).first()).toBeVisible();
	expect((await page.locator('.chessboard').boundingBox())!.height).toBeGreaterThan(200);
	await page.getByRole('button', { name: /analysis/i }).click();
	await expect(page.getByText('Review ready', { exact: true })).toBeVisible({ timeout: 60000 });
	await expect(page.getByText('7 / 7 positions', { exact: true })).toBeVisible();
	expect(unexpected).toEqual([]);
	fs.writeFileSync(
		`artifacts/frozenight/privacy-${info.project.name}.json`,
		JSON.stringify(
			{
				unexpectedRequests: unexpected,
				scope:
					'Fresh PGN import and completed local review; GET/HEAD static assets only, no external destinations or request bodies.'
			},
			null,
			2
		)
	);
});
