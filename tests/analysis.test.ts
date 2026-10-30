import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AnalysisResult, AnalyzeRequest } from 'chess-engine-kit';
import { frozenightManifest } from 'chess-engine-kit/frozenight/manual';
import { resultKey, ResultCache } from '../src/lib/engine/cache.ts';
import { isCachedResult } from '../src/lib/engine/cached-result.ts';
import { classify, formatScore } from '../src/lib/engine/classification.ts';
const identity = { ...frozenightManifest.descriptor, settingsFingerprint: 'test-hash32' };
const request: AnalyzeRequest = {
	apiVersion: 1,
	jobId: 'one',
	positionId: 'start',
	position: { rootFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', movesUci: [] },
	limits: { maxNodes: 30_000 },
	multiPv: 1
};
function result(rootMove = 'e2e4', value = 30, depth: number | null = 6): AnalysisResult {
	return {
		...identity,
		apiVersion: 1,
		jobId: 'one',
		positionId: 'start',
		elapsedMs: 10,
		sequence: 1,
		completedIteration: true,
		completion: 'limited',
		reason: 'nodes',
		depth,
		nodes: 30_000,
		iterationNodes: 1000,
		lines: [
			{
				rank: 1,
				rootMove,
				pv: [rootMove],
				score: { perspective: 'white', kind: 'cp', bound: 'exact', value }
			}
		]
	};
}
test('classification compares played roots, preserves score perspective and rejects unknown horizons', () => {
	assert.equal(classify(result(), result('d2d4', 25), 'w', 'd2d4', 0).name, 'Good');
	assert.equal(classify(result('e7e5', -200), result('d7d5', 100), 'b', 'd7d5', 0).name, 'Blunder');
	assert.equal(classify(result(), result('d2d4', 40), 'w', 'd2d4', 0).noise, true);
	for (const depth of [12, null]) {
		const quality = classify(result(), result('d2d4', -400, depth), 'w', 'd2d4', 0, true);
		assert.equal(quality.name, 'Uncertain');
		assert.equal(quality.preliminary, true);
	}
	assert.equal(
		formatScore({ perspective: 'white', kind: 'mate', value: -3, unit: 'plies', bound: 'exact' }),
		'−M2'
	);
	assert.equal(
		formatScore({ perspective: 'white', kind: 'cp', value: 35, bound: 'lower' }),
		'≥+0.35'
	);
});
test('result keys include SDK identity, history, budgets, root restrictions and settings', async () => {
	const key = await resultKey(request, identity);
	assert.equal(await resultKey({ ...request, jobId: 'different' }, identity), key);
	for (const field of [
		'engineId',
		'engineName',
		'engineVersion',
		'sourceRevision',
		'buildHash',
		'adapterHash',
		'modelHash',
		'settingsFingerprint'
	] as const) {
		assert.notEqual(await resultKey(request, { ...identity, [field]: 'changed' }), key, field);
	}
	for (const other of [
		{ ...request, position: { ...request.position, movesUci: ['e2e4'] } },
		{ ...request, limits: { maxNodes: 100_000 } },
		{ ...request, multiPv: 3 },
		{ ...request, rootMoves: ['d2d4'] }
	])
		assert.notEqual(await resultKey(other, identity), key);
});
test('persistent results require matching identity, valid schema, legal PVs and allowed roots', () => {
	assert.equal(isCachedResult(result(), request, identity), true);
	const optionalCounters = {
		...result(),
		depth: null,
		nodes: null,
		iterationNodes: undefined,
		memoryBytes: null
	};
	assert.equal(isCachedResult(optionalCounters, request, identity), true);
	for (const value of [
		null,
		{},
		{ ...result(), adapterHash: 'old-adapter' },
		{ ...result(), completedIteration: false },
		{ ...result(), depth: -1 },
		{ ...result(), completion: 'progress' },
		{ ...result(), lines: [] },
		{ ...result(), lines: [{ ...result().lines[0], pv: ['e2e4', 'e7e4'] }] },
		{
			...result(),
			lines: [{ ...result().lines[0], score: { ...result().lines[0].score, perspective: 'black' } }]
		},
		{
			...result(),
			lines: [{ ...result().lines[0], score: { ...result().lines[0].score, kind: 'mate' } }]
		}
	])
		assert.equal(isCachedResult(value, request, identity), false);
	assert.equal(isCachedResult(result(), { ...request, rootMoves: ['d2d4'] }, identity), false);
});
test('cached terminal positions require matching board outcome, winner and score', () => {
	const terminal: AnalysisResult = {
		...result(),
		lines: [],
		depth: 0,
		nodes: 0,
		iterationNodes: 0,
		completion: 'completed',
		reason: 'terminal',
		outcome: 'checkmate',
		winner: 'white',
		terminalScore: { perspective: 'white', kind: 'mate', value: 0, unit: 'plies', bound: 'exact' }
	};
	const terminalRequest = {
		...request,
		position: { rootFen: '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1', movesUci: [] }
	};
	assert.equal(isCachedResult(terminal, terminalRequest, identity), true);
	assert.equal(isCachedResult({ ...terminal, winner: 'black' }, terminalRequest, identity), false);
	assert.equal(isCachedResult(terminal, request, identity), false);
});
test('session cache stores only completed iterations and isolates caller mutations', async () => {
	const cache = new ResultCache();
	try {
		const value = result();
		await cache.put('valid', value);
		value.lines[0].pv[0] = 'e2e5';
		assert.equal(isCachedResult(await cache.get('valid'), request, identity), true);
		await cache.put('partial', { ...result(), completedIteration: false });
		assert.equal(await cache.get('partial'), undefined);
	} finally {
		cache.dispose();
	}
});
