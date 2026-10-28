import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { Chess } from 'chess.js';
import { instantiateEngine } from '../src/lib/engine/wasm.ts';
import { validateResult } from '../src/lib/engine/validation.ts';
const manifest = JSON.parse(fs.readFileSync('static/engine/frozenight/manifest.json', 'utf8'));
const bytes = fs.readFileSync('tests/fixtures/tactical-corpus.json');
const corpus = JSON.parse(bytes.toString());
const engine = await instantiateEngine(
	await WebAssembly.compile(fs.readFileSync('static' + manifest.wasmPath)),
	() => {}
);
const rows: Record<string, unknown>[] = [];
for (const nodes of [30_000, 100_000, 300_000]) {
	for (const fixture of corpus.positions.filter(
		(p: { partition: string }) => p.partition === 'held-out'
	)) {
		const position = { rootFen: fixture.rootFen, movesUci: [...fixture.movesUci] };
		const chess = new Chess(position.rootFen);
		const move = (uci: string) =>
			chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
		for (const uci of position.movesUci) move(uci);
		const started = performance.now();
		const searches = [];
		let solved = true;
		for (let i = 0; i < fixture.solution.length; i++) {
			const expected = fixture.solution[i];
			if (i % 2 === 0) {
				const result = engine.run({
					position,
					limits: { maxNodes: nodes, maxTimeMs: 750 },
					multiPv: 1,
					hashMiB: 32
				});
				validateResult(result, position, 1);
				const actual = result.lines[0]?.rootMove;
				searches.push({ expected, actual, result });
				if (actual !== expected) {
					if (actual) {
						move(actual);
						solved = chess.isCheckmate();
					} else solved = false;
					break;
				}
			}
			move(expected);
			position.movesUci.push(expected);
		}
		rows.push({
			id: fixture.id,
			nodes,
			timeCapMs: 750,
			rating: fixture.rating,
			themes: fixture.themes,
			solved,
			elapsedMs: performance.now() - started,
			searches,
			memoryBytes: engine.exports.memory.buffer.byteLength
		});
	}
	console.log(
		nodes,
		rows.filter((r) => r.nodes === nodes && r.solved).length,
		'/100 puzzles solved'
	);
}
fs.writeFileSync(
	'artifacts/frozenight/tactical-diagnostic.json',
	JSON.stringify(
		{
			timestamp: new Date().toISOString(),
			manifest,
			corpusSha256: createHash('sha256').update(bytes).digest('hex'),
			source: corpus.source,
			rights: corpus.rights,
			samplesPerBudget: 100,
			policy:
				'All solver turns must match the published UCI solution, or an alternative must immediately checkmate. Failures remain in the results.',
			limitations:
				'Desktop convenience sample, not phone performance or a representative strength rating. 100k/300k budgets are exploratory and are not the shipped quick budget.',
			rows
		},
		null,
		2
	)
);
fs.writeFileSync(
	'artifacts/frozenight/tactical-diagnostic.csv',
	'id,nodes,timeCapMs,rating,solved,elapsedMs,memoryBytes\n' +
		rows
			.map((r) =>
				['id', 'nodes', 'timeCapMs', 'rating', 'solved', 'elapsedMs', 'memoryBytes']
					.map((k) => r[k])
					.join(',')
			)
			.join('\n') +
		'\n'
);
