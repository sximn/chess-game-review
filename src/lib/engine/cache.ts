import type { AnalyzeRequest, AnalysisResult, Identity } from 'chess-engine-kit';
import { cacheIdentity } from './cached-result.ts';

export const CLASSIFICATION_VERSION = 'loss-v2';

export async function resultKey(request: AnalyzeRequest, identity: Identity) {
	const text = JSON.stringify({
		api: 1,
		position: request.position,
		identity: cacheIdentity(identity),
		limits: request.limits,
		multiPv: request.multiPv,
		rootMoves: request.rootMoves ?? [],
		classification: CLASSIFICATION_VERSION
	});
	return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))]
		.map((x) => x.toString(16).padStart(2, '0'))
		.join('');
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
			const request = indexedDB.open('upapawn-analysis-v2', 1);

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

	async get(key: string): Promise<unknown> {
		const inMemory = this.memory.get(key);
		if (inMemory) {
			return structuredClone(inMemory);
		}

		try {
			const db = await this.db();
			if (!db) {
				return;
			}

			return await new Promise<unknown>((resolve) => {
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
		if (!value.completedIteration || (!value.lines.length && !value.outcome)) {
			return;
		}

		this.memory.set(key, structuredClone(value));

		if (this.memory.size > 128) {
			this.memory.delete(this.memory.keys().next().value!);
		}

		try {
			const db = await this.db();
			if (!db) {
				return;
			}

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
