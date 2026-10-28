import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { ReviewController, type ReviewState } from '../src/lib/engine/review.ts';
import type { EngineClient } from '../src/lib/engine/client.ts';
import type { AnalyzeRequest, AnalysisResult } from '../src/lib/engine/types.ts';
import { BUILD } from '../src/lib/engine/build.ts';

test('played-root comparisons use the best completed horizon and finish a progressive review', async () => {
	const requests: AnalyzeRequest[] = [];
	const identity = {
		engineCommit: BUILD.upstreamCommit,
		buildHash: BUILD.buildHash,
		networkHash: BUILD.networkHash,
		settingsFingerprint: 'test-hash32'
	};
	const engine = {
		identity,
		onEvent: () => () => {},
		reset: () => {},
		dispose: () => {},
		initialize: async () => {},
		cancel: () => {},
		analyzePosition: async (request: AnalyzeRequest): Promise<AnalysisResult> => {
			requests.push(request);
			const game = new Chess(request.position.rootFen);
			for (const uci of request.position.movesUci)
				game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
			const moves =
				request.rootMoves ??
				game
					.moves({ verbose: true })
					.map((m) => m.lan)
					.slice(0, request.multiPv);
			return {
				...identity,
				apiVersion: 1,
				jobId: request.jobId,
				positionId: request.positionId,
				elapsedMs: 1,
				sequence: 1,
				memoryBytes: 32 * 1024 * 1024,
				completedIteration: true,
				completion: 'completed',
				reason: 'depth',
				depth: 4,
				nodes: 1000,
				iterationNodes: 1000,
				lines: moves.map((rootMove, i) => ({
					rank: i + 1,
					rootMove,
					pv: [rootMove],
					score: { perspective: 'white', kind: 'cp', bound: 'exact', value: 0 }
				}))
			};
		}
	} as unknown as EngineClient;
	let done!: (state: ReviewState) => void;
	const complete = new Promise<ReviewState>((resolve) => (done = resolve));
	const review = new ReviewController((state) => {
		if (state.phase === 'complete') done(state);
	}, engine);
	try {
		review.reviewGame('1. e4 e5 *');
		const state = await complete;
		assert.equal(state.scored, 3);
		assert.equal(state.qualities.filter(Boolean).length, 2);
		const restricted = requests.filter((r) => r.rootMoves);
		assert.ok(restricted.length > 0);
		assert.ok(restricted.every((r) => r.limits.maxDepth === 4));
		assert.ok(
			state.qualities.filter(Boolean).every((q) => q!.comparedDepths[0] === q!.comparedDepths[1])
		);
	} finally {
		review.dispose();
	}
});
