// Verify the actual packaged bytes, including workers, WASM, model and notices.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(fs.readFileSync('static/engines/frozenight/manifest.json', 'utf8'));
const files = [];
function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		if (e.name === '.DS_Store') continue;
		const p = path.join(dir, e.name);
		if (e.isDirectory()) walk(p);
		else files.push(path.relative('build', p));
	}
}
walk('build');
const report = {
	timestamp: new Date().toISOString(),
	engineBuild: manifest.descriptor.buildHash,
	wasmSha256: manifest.wasm.sha256,
	files: files.length,
	platforms: {}
};
if (process.argv.includes('--android')) {
	const apk = process.argv.includes('--release')
		? 'android/app/build/outputs/apk/release/app-release-unsigned.apk'
		: 'android/app/build/outputs/apk/debug/app-debug.apk';
	for (const file of files) {
		const actual = execFileSync('unzip', ['-p', apk, 'assets/public/' + file], {
			maxBuffer: 32 * 1024 * 1024
		});
		if (hash(actual) !== hash(fs.readFileSync(path.join('build', file))))
			throw Error('APK asset mismatch: ' + file);
	}
	report.platforms.android = {
		apk,
		apkSha256: hash(fs.readFileSync(apk)),
		allAssetsIdentical: true
	};
}
const ios = process.argv.indexOf('--ios');
if (ios >= 0) {
	const app = process.argv[ios + 1];
	if (!app) throw Error('--ios requires the built .app path');
	for (const file of files) {
		if (
			hash(fs.readFileSync(path.join(app, 'public', file))) !==
			hash(fs.readFileSync(path.join('build', file)))
		)
			throw Error('iOS asset mismatch: ' + file);
	}
	report.platforms.ios = { app, allAssetsIdentical: true };
}
if (!Object.keys(report.platforms).length) throw Error('Select --android and/or --ios <built-app>');
fs.mkdirSync('artifacts/app-verification', { recursive: true });
fs.writeFileSync(
	'artifacts/app-verification/' +
		(process.argv.includes('--release') ? 'native-assets-release.json' : 'native-assets.json'),
	JSON.stringify(report, null, 2) + '\n'
);
console.log(JSON.stringify(report, null, 2));
