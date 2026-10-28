import { BUILD } from './build.ts';
import { EngineError } from './types.ts';
export async function digest(bytes: BufferSource) {
	return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
		.map((x) => x.toString(16).padStart(2, '0'))
		.join('');
}
export async function loadEngineAsset() {
	if (
		typeof WebAssembly === 'undefined' ||
		typeof Worker === 'undefined' ||
		!globalThis.crypto?.subtle
	)
		throw new EngineError('UNSUPPORTED_BROWSER', 'This browser cannot run local analysis.');
	let cache: Cache | undefined;
	try {
		cache = await caches.open('upapawn-engine-assets-v1');
	} catch {
		/* Installed Capacitor assets remain available without CacheStorage. */
	}
	const url = new URL(BUILD.wasmPath, location.href).href;
	let response = await cache?.match(url);
	if (response) {
		const bytes = await response.arrayBuffer();
		if ((await digest(bytes)) === BUILD.wasmSha256)
			return { module: await compile(bytes), offlineAssets: true };
		await cache?.delete(url);
	}
	try {
		response = await fetch(url, { cache: 'reload', signal: AbortSignal.timeout(30_000) });
	} catch {
		throw new EngineError(
			'ASSET_FETCH_FAILED',
			'Could not load the local engine. Retry when the app is available.',
			true
		);
	}
	if (!response.ok)
		throw new EngineError('ASSET_FETCH_FAILED', 'The engine asset could not be loaded.', true);
	const bytes = await response.arrayBuffer();
	if (bytes.byteLength !== BUILD.rawBytes || (await digest(bytes)) !== BUILD.wasmSha256)
		throw new EngineError('INTEGRITY_FAILED', 'The engine asset failed its integrity check.', true);
	let offlineAssets = false;
	try {
		await cache?.put(url, new Response(bytes, { headers: { 'Content-Type': 'application/wasm' } }));
		offlineAssets = !!cache;
	} catch {
		/* Storage quota does not prevent this session. */
	}
	return { module: await compile(bytes), offlineAssets };
}
async function compile(bytes: ArrayBuffer) {
	try {
		return await WebAssembly.compile(bytes);
	} catch {
		throw new EngineError('UNSUPPORTED_BROWSER', 'The engine cannot be compiled by this browser.');
	}
}
