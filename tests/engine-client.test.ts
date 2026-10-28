import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { EngineClient } from '../src/lib/engine/client.ts';
import { EngineError, type AnalyzeRequest, type EngineEvent } from '../src/lib/engine/types.ts';
const module = await WebAssembly.compile(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
class FakeWorker {
	onmessage: ((e: { data: any }) => void) | null = null;
	onerror: ((e: any) => void) | null = null;
	onmessageerror: ((e: any) => void) | null = null;
	terminated = false;
	request?: AnalyzeRequest;
	postMessage(data: any) {
		if (data.type === 'initialize')
			queueMicrotask(() => this.onmessage?.({ data: { type: 'ready', apiVersion: 1 } }));
		else this.request = data.request;
	}
	terminate() {
		this.terminated = true;
	}
	finish(handler = this.onmessage) {
		handler?.({
			data: {
				type: 'completed',
				jobId: this.request!.jobId,
				memoryBytes: 32 * 1024 * 1024,
				result: {
					lines: [
						{
							rank: 1,
							rootMove: 'e2e4',
							pv: ['e2e4'],
							score: { perspective: 'white', kind: 'cp', value: 20, bound: 'exact' }
						}
					],
					depth: 1,
					nodes: 20,
					iterationNodes: 20,
					completedIteration: true,
					reason: 'depth'
				}
			}
		});
	}
}
const request = (id: string): AnalyzeRequest => ({
	apiVersion: 1,
	jobId: id,
	positionId: 'position-' + id,
	position: { rootFen: new Chess().fen(), movesUci: [] },
	limits: { maxNodes: 1000, maxTimeMs: 100 },
	multiPv: 1
});
const tick = () => new Promise((r) => setTimeout(r, 0));
function setup() {
	const workers: FakeWorker[] = [];
	const client = new EngineClient(
		() => {
			const w = new FakeWorker();
			workers.push(w);
			return w as unknown as Worker;
		},
		async () => ({ module, offlineAssets: true })
	);
	const events: EngineEvent[] = [];
	client.onEvent((e) => events.push(e));
	return { client, workers, events };
}

test('100 navigation cancellations have exactly one terminal event and reject stale completions', async () => {
	const { client, workers, events } = setup();
	await client.initialize();
	for (let i = 0; i < 100; i++) {
		const cancelled = client.analyzePosition(request('old-' + i)).catch((e) => e);
		await tick();
		const old = workers.at(-1)!;
		const staleHandler = old.onmessage;
		assert.equal(client.cancel('old-' + i).status, 'stopped');
		assert.equal(old.onmessage, null);
		assert.equal(old.onerror, null);
		assert.equal(old.onmessageerror, null);
		assert.equal((await cancelled).code, 'CANCELLED');
		old.finish(staleHandler);
		const done = client.analyzePosition(request('new-' + i));
		await tick();
		workers.at(-1)!.finish();
		const result = await done;
		assert.equal(result.positionId, 'position-new-' + i);
		assert.equal(client.cancel('new-' + i).status, 'already-finished');
	}
	assert.equal(events.filter((e) => e.type !== 'progress').length, 200);
	assert.equal(new Set(events.map((e) => ('result' in e ? e.result.jobId : e.jobId))).size, 200);
	client.dispose();
});
test('crashes synthesize failure and allow recovery; dispose detaches stale events', async () => {
	const { client, workers, events } = setup();
	await client.initialize();
	const failed = client.analyzePosition(request('crash')).catch((e) => e);
	await tick();
	workers.at(-1)!.onerror?.({});
	assert.equal((await failed).code, 'ENGINE_CRASHED');
	assert.equal(events.at(-1)?.type, 'failed');
	const next = client.analyzePosition(request('recover'));
	await tick();
	workers.at(-1)!.finish();
	assert.equal((await next).jobId, 'recover');
	const count = events.length;
	const old = workers.at(-1)!;
	client.dispose();
	old.finish();
	assert.equal(events.length, count);
	await client.initialize();
	client.dispose();
});
test('version/network/options validation runs before disturbing a valid search', async () => {
	const { client, workers } = setup();
	await assert.rejects(
		client.initialize({ networkHash: 'wrong' }),
		(e) => e instanceof EngineError && e.code === 'NETWORK_MISMATCH'
	);
	await assert.rejects(client.initialize({ hashMiB: 128 }), /Hash/);
	await client.initialize();
	const good = client.analyzePosition(request('good'));
	await tick();
	await assert.rejects(client.analyzePosition({ ...request('bad'), multiPv: 9 }), /limits/);
	workers.at(-1)!.finish();
	assert.equal((await good).jobId, 'good');
	client.dispose();
});

test('a rejected asset load from a disposed generation cannot clear the new verified module', async () => {
	let loads = 0;
	let rejectOld!: (error: Error) => void;
	const client = new EngineClient(
		() => new FakeWorker() as unknown as Worker,
		() =>
			++loads === 1
				? new Promise((_, reject) => {
						rejectOld = reject;
					})
				: Promise.resolve({ module, offlineAssets: true })
	);
	const old = client.initialize().catch((e) => e);
	await tick();
	client.dispose();
	await client.initialize();
	rejectOld(new EngineError('ASSET_FETCH_FAILED', 'old request failed', true));
	assert.equal((await old).code, 'ASSET_FETCH_FAILED');
	client.reset();
	await client.initialize();
	assert.equal(loads, 2);
	client.dispose();
});
