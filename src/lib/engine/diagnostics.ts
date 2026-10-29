import { API_VERSION } from 'chess-engine-kit';
import { createReviewEngine } from './provider.ts';

export async function runDiagnostics(
	progress: (message: string) => void = () => {},
	signal?: AbortSignal
) {
	const engine = createReviewEngine();
	const cancel = () => engine.dispose();
	signal?.throwIfAborted();
	signal?.addEventListener('abort', cancel, { once: true });
	const started = performance.now();
	try {
		progress('Loading local engine assets…');
		const ready = await engine.initialize();
		progress('Analyzing a local position…');
		const result = await engine.analyzePosition({
			apiVersion: API_VERSION,
			jobId: crypto.randomUUID(),
			positionId: 'diagnostics-start',
			position: {
				rootFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
				movesUci: []
			},
			limits: { maxNodes: 30_000, maxTimeMs: 1500, maxDepth: 3 },
			multiPv: 3
		});
		if (!result.completedIteration || !result.lines.length)
			throw Error('No analysis iteration completed. Retry diagnostics.');
		return {
			identity: engine.identity,
			capabilities: ready.capabilities,
			offlineAssets: ready.offlineAssets,
			depth: result.depth,
			nodes: result.nodes,
			candidateLines: result.lines.length,
			memoryBytes: result.memoryBytes,
			elapsedMs: performance.now() - started,
			userAgent: navigator.userAgent
		};
	} finally {
		signal?.removeEventListener('abort', cancel);
		engine.dispose();
	}
}
