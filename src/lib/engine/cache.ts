import { BUILD } from './build.ts';
import { digest } from './assets.ts';
import type { AnalyzeRequest, AnalysisResult } from './types.ts';
export const CLASSIFICATION_VERSION = 'loss-v2';
export async function resultKey(request: AnalyzeRequest, settingsFingerprint: string) {
	const text = JSON.stringify({
		api: 1,
		position: request.position,
		engine: BUILD.upstreamCommit,
		build: BUILD.buildHash,
		network: BUILD.networkHash,
		settingsFingerprint,
		limits: request.limits,
		multiPv: request.multiPv,
		rootMoves: request.rootMoves ?? [],
		classification: CLASSIFICATION_VERSION
	});
	return digest(new TextEncoder().encode(text));
}
export class ResultCache {
	private memory = new Map<string, AnalysisResult>();
	private connection?: Promise<IDBDatabase | undefined>;
	warning = '';
	private db() {
		return (this.connection ??= new Promise<IDBDatabase | undefined>((resolve) => {
			if (typeof indexedDB === 'undefined') {
				resolve(undefined);
				return;
			}
			const request = indexedDB.open('upapawn-analysis-v1', 1);
			request.onupgradeneeded = () =>
				request.result
					.createObjectStore('results', { keyPath: 'key' })
					.createIndex('touched', 'touched');
			request.onsuccess = () => {
				request.result.onversionchange = () => request.result.close();
				resolve(request.result);
			};
			request.onerror = () => {
				this.warning = 'Device storage is unavailable; analysis will continue in this session.';
				resolve(undefined);
			};
			request.onblocked = () => resolve(undefined);
		}));
	}
	async get(key: string) {
		const inMemory = this.memory.get(key);
		if (inMemory) return structuredClone(inMemory);
		try {
			const db = await this.db();
			if (!db) return;
			return await new Promise<AnalysisResult | undefined>((resolve) => {
				const tx = db.transaction('results');
				const req = tx.objectStore('results').get(key);
				req.onsuccess = () => resolve(req.result?.value);
				req.onerror = () => resolve(undefined);
			});
		} catch {
			return;
		}
	}
	async put(key: string, value: AnalysisResult) {
		if (!value.completedIteration || (!value.lines.length && !value.outcome)) return;
		this.memory.set(key, structuredClone(value));
		if (this.memory.size > 128) this.memory.delete(this.memory.keys().next().value!);
		try {
			const db = await this.db();
			if (!db) return;
			await new Promise<void>((resolve, reject) => {
				const tx = db.transaction('results', 'readwrite');
				const store = tx.objectStore('results');
				store.put({ key, value, touched: Date.now() });
				const count = store.count();
				count.onsuccess = () => {
					let excess = count.result - 1000;
					if (excess > 0) {
						const cursor = store.index('touched').openCursor();
						cursor.onsuccess = () => {
							if (cursor.result && excess-- > 0) {
								cursor.result.delete();
								cursor.result.continue();
							}
						};
					}
				};
				tx.oncomplete = () => resolve();
				tx.onabort = () => reject(tx.error);
				tx.onerror = () => reject(tx.error);
			});
		} catch {
			this.warning = 'Device storage is full; new results are kept for this session.';
		}
	}
	dispose() {
		void this.connection?.then((db) => db?.close());
		this.connection = undefined;
		this.memory.clear();
	}
}
