import { test, expect } from '@playwright/test';
import { Chess } from 'chess.js';
import fs from 'node:fs';

test('worker completes every root and played-move search in an 80-ply game within its deadline', async ({
	page
}, info) => {
	test.setTimeout(180000);
	const corpus = JSON.parse(fs.readFileSync('tests/fixtures/engine-corpus.json', 'utf8'));
	const fixture = corpus.games.find(
		(g: { partition: string; plies: number }) => g.partition === 'held-out' && g.plies === 80
	);
	const chess = new Chess();
	chess.loadPgn(fixture.pgn);
	const moves = chess.history({ verbose: true });
	const inputs = Array.from({ length: 81 }, (_, ply) => ({
		position: { rootFen: moves[0].before, movesUci: moves.slice(0, ply).map((m) => m.lan) },
		played: moves[ply]?.lan
	}));
	const workerFile = fs
		.readdirSync('build/_app/immutable/workers')
		.find((n) => n.startsWith('worker-'))!;
	await page.goto('/diagnostics');
	const rows = await page.evaluate(
		async ({ inputs, workerFile }) => {
			const manifest = await (await fetch('/engine/frozenight/manifest.json')).json();
			const module = await WebAssembly.compile(
				await (await fetch(manifest.wasmPath)).arrayBuffer()
			);
			const worker = new Worker('/_app/immutable/workers/' + workerFile, { type: 'module' });
			let receive: (data: any) => void = () => {};
			worker.onmessage = (e) => receive(e.data);
			worker.onerror = (e) => {
				throw new Error(e.message);
			};
			const rows: {
				ply: number;
				restricted: boolean;
				elapsedMs: number;
				depth: number;
				reason: string;
				nodes: number;
			}[] = [];
			try {
				await new Promise<void>((resolve, reject) => {
					const timer = setTimeout(() => reject(Error('Worker init timeout')), 5000);
					receive = (data) => {
						if (data.type === 'ready') {
							clearTimeout(timer);
							resolve();
						}
					};
					worker.postMessage({ type: 'initialize', module });
				});
				let sequence = 0;
				for (const [ply, input] of inputs.entries()) {
					const run = (rootMoves?: string[]) =>
						new Promise<any>((resolve, reject) => {
							const started = performance.now();
							const timer = setTimeout(
								() =>
									reject(Error(`Engine deadline failed at ply ${ply}, restricted=${!!rootMoves}`)),
								5000
							);
							receive = (data) => {
								if (data.type === 'failed') {
									clearTimeout(timer);
									reject(Error(data.error.code));
								}
								if (data.type === 'completed') {
									clearTimeout(timer);
									rows.push({
										ply,
										restricted: !!rootMoves,
										elapsedMs: performance.now() - started,
										depth: data.result.depth,
										reason: data.result.reason,
										nodes: data.result.nodes
									});
									resolve(data.result);
								}
							};
							worker.postMessage({
								type: 'analyze',
								hashMiB: 32,
								request: {
									apiVersion: 1,
									jobId: 'raw-' + ++sequence,
									positionId: 'ply-' + ply,
									position: input.position,
									limits: { maxNodes: 30000, maxTimeMs: 750 },
									multiPv: 1,
									...(rootMoves ? { rootMoves } : {})
								}
							});
						});
					const result = await run();
					if (input.played && result.lines[0]?.rootMove !== input.played) await run([input.played]);
				}
				return rows;
			} finally {
				worker.terminate();
			}
		},
		{ inputs, workerFile }
	);
	expect(new Set(rows.map((r) => r.ply)).size).toBe(81);
	fs.writeFileSync(
		`artifacts/frozenight/worker-game-${info.project.name}.json`,
		JSON.stringify(
			{
				rows,
				scope:
					'Actual production Worker, root and played-root searches, no review UI or IndexedDB.',
				build: JSON.parse(fs.readFileSync('static/engine/frozenight/manifest.json', 'utf8')),
				fixtureId: fixture.id
			},
			null,
			2
		)
	);
});
