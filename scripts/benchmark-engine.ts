// Desktop fidelity/quality diagnostic. Physical-phone qualification is a separate release gate.
import fs from 'node:fs';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { instantiateEngine } from '../src/lib/engine/wasm.ts';
import { validateResult } from '../src/lib/engine/validation.ts';
import type { RawResult, Position } from '../src/lib/engine/types.ts';
const manifest = JSON.parse(fs.readFileSync('static/engine/frozenight/manifest.json', 'utf8'));
const corpusBytes = fs.readFileSync('tests/fixtures/engine-corpus.json');
const corpus = JSON.parse(corpusBytes.toString());
const module = await WebAssembly.compile(fs.readFileSync('static' + manifest.wasmPath));
const engine = await instantiateEngine(module, () => {});
const native = spawn('engine/frozenight/target/release/frozenight-reference');
const responses = createInterface({ input: native.stdout });
let pending: { resolve: (r: RawResult) => void; reject: (e: Error) => void } | undefined;
responses.on('line', (line) => {
	pending?.resolve(JSON.parse(line));
	pending = undefined;
});
native.on('error', (e) => pending?.reject(e));
native.on('exit', () => pending?.reject(new Error('Native reference exited.')));
const reference = (position: Position, nodes: number, rootMoves?: string[]) =>
	new Promise<RawResult>((resolve, reject) => {
		pending = { resolve, reject };
		native.stdin.write(
			JSON.stringify({
				position,
				limits: { maxNodes: nodes },
				multiPv: 1,
				hashMiB: 32,
				rootMoves
			}) + '\n'
		);
	});
const count = Number(process.argv[process.argv.indexOf('--count') + 1]) || 100;
const fixtures = corpus.positions
	.filter((p: { partition: string }) => p.partition === 'held-out')
	.slice(0, count);
const rows: Record<string, unknown>[] = [];
const budget = Number(process.argv[process.argv.indexOf('--nodes') + 1]) || 30_000;
const output = `artifacts/frozenight/budget-${budget}`;
const scoreStable = (a: RawResult, b: RawResult) =>
	a.completedIteration &&
	b.completedIteration &&
	a.lines[0]?.rootMove === b.lines[0]?.rootMove &&
	a.lines[0]?.score.kind === b.lines[0]?.score.kind &&
	(a.lines[0]?.score.kind === 'mate'
		? a.lines[0].score.value === b.lines[0].score.value
		: Math.abs(a.lines[0].score.value - b.lines[0].score.value) <= 10);
try {
	for (const p of fixtures) {
		const position = { rootFen: p.rootFen, movesUci: p.movesUci };
		const started = performance.now();
		const quick = engine.run({ position, limits: { maxNodes: budget }, multiPv: 1, hashMiB: 32 });
		const elapsedMs = performance.now() - started;
		validateResult(quick, position, 1);
		const reference10x = await reference(position, budget * 10);
		const reference20x = await reference(position, budget * 20);
		const stable = scoreStable(reference10x, reference20x);
		let candidate10x = reference10x,
			candidate20x = reference20x;
		const move = quick.lines[0]?.rootMove;
		if (move && move !== reference20x.lines[0]?.rootMove) {
			candidate10x = await reference(position, budget * 10, [move]);
			candidate20x = await reference(position, budget * 20, [move]);
		}
		const candidateStable = scoreStable(candidate10x, candidate20x);
		const q = quick.lines[0]?.score,
			r = reference20x.lines[0]?.score,
			c = candidate20x.lines[0]?.score;
		const sign = p.fen.split(' ')[1] === 'w' ? 1 : -1;
		const errorCp = q?.kind === 'cp' && r?.kind === 'cp' ? Math.abs(q.value - r.value) : null;
		const lossCp =
			c?.kind === 'cp' && r?.kind === 'cp' ? Math.max(0, (r.value - c.value) * sign) : null;
		const acceptable =
			stable && candidateStable
				? lossCp !== null
					? lossCp <= 30
					: move === reference20x.lines[0]?.rootMove
				: null;
		rows.push({
			id: p.id,
			partition: p.partition,
			elapsedMs,
			peakMemoryBytes: engine.exports.memory.buffer.byteLength,
			stable,
			candidateStable,
			acceptable,
			errorCp,
			lossCp,
			quick,
			reference10x,
			reference20x,
			candidate10x,
			candidate20x
		});
		console.log(
			`${rows.length}/${fixtures.length}: ${p.id}, ${elapsedMs.toFixed(1)} ms, stable=${stable}, acceptable=${acceptable}`
		);
		// Preserve partial results if an exploratory run is interrupted.
		fs.writeFileSync(
			output + '.json',
			JSON.stringify(
				{
					timestamp: new Date().toISOString(),
					manifest,
					host: {
						platform: os.platform(),
						arch: os.arch(),
						cpus: os.cpus()[0]?.model,
						node: process.version
					},
					corpusSha256: createHash('sha256').update(corpusBytes).digest('hex'),
					budget,
					referenceBudgets: [budget * 10, budget * 20],
					referenceStabilityCp: 10,
					acceptableMoveLossCp: 30,
					samples: rows.length,
					rows,
					limitations:
						'Exploratory desktop node-only test of original self-generated positions. Inconclusive references retained. No independent annotated tactical subset, phone timings, or release-quality claim.'
				},
				null,
				2
			)
		);
	}
	const fields = [
		'id',
		'partition',
		'elapsedMs',
		'peakMemoryBytes',
		'stable',
		'candidateStable',
		'acceptable',
		'errorCp',
		'lossCp'
	];
	fs.writeFileSync(
		output + '.csv',
		fields.join(',') +
			'\n' +
			rows.map((r) => fields.map((k) => r[k] ?? '').join(',')).join('\n') +
			'\n'
	);
} finally {
	native.stdin.end();
}
