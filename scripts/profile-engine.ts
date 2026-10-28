// Run with node --cpu-prof --cpu-prof-dir=artifacts/frozenight --cpu-prof-name=engine.cpuprofile --experimental-strip-types scripts/profile-engine.ts
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { instantiateEngine } from '../src/lib/engine/wasm.ts';
import { replay, validateResult } from '../src/lib/engine/validation.ts';
const build = JSON.parse(fs.readFileSync('static/engine/frozenight/manifest.json', 'utf8'));
const corpus = JSON.parse(fs.readFileSync('tests/fixtures/engine-corpus.json', 'utf8'));
const beforeCompile = performance.now();
const module = await WebAssembly.compile(fs.readFileSync('static' + build.wasmPath));
const afterCompile = performance.now();
const engine = await instantiateEngine(module, () => {});
const afterInstantiate = performance.now();
const rows = [];
for (const p of corpus.positions.slice(400, 420)) {
	const position = { rootFen: p.rootFen, movesUci: p.movesUci };
	const t0 = performance.now();
	replay(position);
	const t1 = performance.now();
	const result = engine.run({ position, limits: { maxNodes: 100000 }, multiPv: 3, hashMiB: 32 });
	const t2 = performance.now();
	validateResult(result, position, 3);
	const t3 = performance.now();
	rows.push({
		id: p.id,
		inputValidationMs: t1 - t0,
		wasmComputeMs: t2 - t1,
		outputValidationMs: t3 - t2,
		linearMemoryBytes: engine.exports.memory.buffer.byteLength,
		nodes: result.nodes,
		depth: result.depth
	});
}
fs.writeFileSync(
	'artifacts/frozenight/profile-phases.json',
	JSON.stringify(
		{
			timestamp: new Date().toISOString(),
			build: build.buildHash,
			compileMs: afterCompile - beforeCompile,
			instantiateMs: afterInstantiate - afterCompile,
			rows,
			limitation:
				'Exploratory Node desktop CPU diagnostic, not browser UI/whole-tab memory or physical-phone acceptance.'
		},
		null,
		2
	)
);
