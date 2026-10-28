import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
const dir = 'artifacts/frozenight';
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const write = (name, data) =>
	fs.writeFileSync(dir + '/' + name, JSON.stringify(data, null, 2) + '\n');
const build = read('static/engine/frozenight/manifest.json');
const host = {
	platform: os.platform(),
	release: os.release(),
	arch: os.arch(),
	cpu: os.cpus()[0].model,
	ramBytes: os.totalmem()
};
const assets = [];
function walk(folder) {
	for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
		const file = path.join(folder, entry.name);
		if (entry.isDirectory()) walk(file);
		else {
			const bytes = fs.readFileSync(file);
			const compressed = bytes.length > 1024 && !/\.(png|ico|woff2?|br|gz)$/.test(file);
			const body = compressed
				? zlib.brotliCompressSync(bytes, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 } })
				: bytes;
			assets.push({
				path: '/' + path.relative('build', file),
				rawBytes: bytes.length,
				servedBodyBytes: body.length,
				encoding: compressed ? 'br-q6' : 'identity',
				sha256: createHash('sha256').update(bytes).digest('hex')
			});
		}
	}
}
walk('build');
write('asset-sizes.json', {
	timestamp: new Date().toISOString(),
	build: build.buildHash,
	scope:
		'All static app files, including fonts/images/notices, counted conservatively; matches preview server compression. Header/protocol bytes excluded.',
	allAppRawBytes: assets.reduce((s, a) => s + a.rawBytes, 0),
	allAppServedBodyBytes: assets.reduce((s, a) => s + a.servedBodyBytes, 0),
	assets
});
const lifecycle = ['chromium', 'webkit', 'firefox'].map((browser) => ({
	browser,
	...read(dir + '/lifecycle-' + browser + '.json')
}));
fs.writeFileSync(
	dir + '/lifecycle.csv',
	'browser,cycle,initializeMs,cancellationAckMs,replacementResultMs\n' +
		lifecycle
			.flatMap((r) =>
				r.raw.cancellationAckMs.map((_, i) =>
					[
						r.browser,
						i,
						r.raw.initializeMs[i],
						r.raw.cancellationAckMs[i],
						r.raw.replacementResultMs[i]
					].join(',')
				)
			)
			.join('\n') +
		'\n'
);
const phase = read(dir + '/profile-phases.json');
const cpu = read(dir + '/engine.cpuprofile');
const byId = new Map(cpu.nodes.map((n) => [n.id, n.callFrame]));
const totals = new Map();
for (let i = 0; i < (cpu.samples?.length ?? 0); i++) {
	const f = byId.get(cpu.samples[i]);
	const name =
		(f.functionName || '(anonymous)') + (f.url ? ' @ ' + f.url.split('/').slice(-2).join('/') : '');
	totals.set(name, (totals.get(name) || 0) + (cpu.timeDeltas[i] || 0));
}
write('profile-summary.json', {
	host,
	cpuSelfTimeMicros: [...totals].sort((a, b) => b[1] - a[1]).slice(0, 20),
	validationOptimization: {
		fixturePlies: 80,
		repetitions: 100,
		beforeElapsedMs: 1087.599,
		afterElapsedMs: 462.038792,
		scope:
			'Separate exploratory Node invocations; UCI object moves avoid SAN parsing and root history is shared across PV validation.'
	},
	phases: phase,
	limitations:
		'WASM function indices are stripped. Linear memory observations do not measure whole-tab memory, energy or thermals.'
});
write('release-manifest.json', {
	timestamp: new Date().toISOString(),
	qualification:
		'NO-GO for release under all requirements; integrated preliminary analysis for qualification',
	build,
	host,
	provisionalMinimums: {
		ios: {
			device: 'iPhone 11',
			chip: 'A13 Bionic',
			os: 'iOS 18',
			browser: 'Safari 18 / system WKWebView',
			measured: false
		},
		android: {
			device: 'Samsung Galaxy A13 SM-A135N (4 GB / Exynos 850)',
			os: 'Android 13',
			browser: 'Chrome / Android System WebView 140',
			measured: false
		}
	},
	plannedMatrix: [
		'Galaxy A13 4 GB, Android 13, Chrome and Capacitor',
		'Galaxy A54 8 GB, Android 14+, Chrome and Capacitor',
		'iPhone 11, iOS 18, Safari and Capacitor',
		'Current iPhone, current supported iOS, Safari and Capacitor'
	],
	measuredNative: {
		ios: 'iPhone 17 Pro simulator, iOS 26.3, actual installed WKWebView app; Debug simulator and unsigned device Release builds; no physical performance claim',
		android:
			'Debug and unsigned Release APKs built; every packaged web asset verified; no Android runtime device available'
	},
	openGates: [
		'C06 stable deeper-reference sample; tactical 90/100 desktop result must be repeated at accepted phone budget',
		'C07 finite-score fidelity target (exploratory 30k and 100k failed)',
		'Physical device floor and midrange latency, network profiles, whole-tab memory, 30+ repetitions',
		'Three 15-minute physical sustained sessions, energy and lock/unlock stress',
		'Android installed runtime validation and oldest browser/OS verification'
	],
	policy:
		'These minimums are engineering qualification targets, not certified device support. No automatic exclusion of older users; feature detection and typed failure remain active.'
});
console.log('Wrote static asset, CPU/memory, lifecycle CSV and release qualification evidence.');
