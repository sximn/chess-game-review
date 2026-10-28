import { EngineClient } from './client.ts';
import { BUILD } from './build.ts';
import { API_VERSION, type AnalyzeRequest, type EngineEvent } from './types.ts';
const ROOT = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export async function runDiagnostics(
	cycles = 100,
	progress: (message: string) => void = () => {},
	signal?: AbortSignal
) {
	const engine = new EngineClient();
	const times: number[] = [],
		ack: number[] = [],
		restart: number[] = [];
	const events: EngineEvent[] = [];
	let stale = 0,
		expected = '';
	let peak = 0;
	const listen = () =>
		engine.onEvent((event) => {
			events.push(event);
			if ('result' in event) {
				peak = Math.max(peak, event.result.memoryBytes);
				if (event.result.positionId !== expected) stale++;
			}
		});
	const make = (id: string, large = false): AnalyzeRequest => ({
		apiVersion: API_VERSION,
		jobId: id,
		positionId: id,
		position: { rootFen: ROOT, movesUci: [] },
		limits: {
			maxNodes: large ? 1_000_000 : 1000,
			maxTimeMs: large ? 2000 : 1000,
			maxDepth: large ? 40 : 1
		},
		multiPv: large ? 3 : 1
	});
	const started = performance.now();
	let capability;
	try {
		for (let i = 0; i < cycles; i++) {
			if (signal?.aborted) throw new Error('Diagnostics cancelled.');
			listen();
			const init = performance.now();
			capability = await engine.initialize({ hashMiB: 16 });
			times.push(performance.now() - init);
			expected = 'cancel-' + i;
			const cancelled = engine.analyzePosition(make(expected, true)).catch((e) => e);
			await new Promise((resolve) => setTimeout(resolve, 2));
			const before = performance.now();
			const status = engine.cancel(expected);
			ack.push(performance.now() - before);
			const error = await cancelled;
			if (status.status !== 'stopped' || error.code !== 'CANCELLED')
				throw new Error('Cancellation contract failed.');
			expected = 'next-' + i;
			const next = performance.now();
			const result = await engine.analyzePosition(make(expected));
			restart.push(performance.now() - next);
			if (result.lines[0]?.pv[0] !== result.lines[0]?.rootMove)
				throw new Error('Invalid engine continuation.');
			engine.reset();
			engine.dispose();
			progress(`Lifecycle ${i + 1} / ${cycles}`);
		}
		const terminal = events.filter((e) => e.type !== 'progress');
		const unique = new Set(terminal.map((e) => ('result' in e ? e.result.jobId : e.jobId)));
		if (terminal.length !== cycles * 2 || unique.size !== cycles * 2 || stale)
			throw new Error('Worker event lifecycle contract failed.');
		const stats = (values: number[]) => {
			const ordered = [...values].sort((a, b) => a - b);
			return {
				samples: values.length,
				p50: ordered[Math.floor(values.length * 0.5)],
				p95: ordered[Math.min(values.length - 1, Math.ceil(values.length * 0.95) - 1)],
				worst: ordered.at(-1)
			};
		};
		return {
			apiVersion: 1,
			build: BUILD.buildHash,
			network: BUILD.networkHash,
			mode: 'scalar',
			threads: 1,
			sharedMemory: false,
			capability,
			cycles,
			terminalEvents: terminal.length,
			staleUpdates: stale,
			peakObservedMemoryBytes: peak,
			warmInitializeMs: stats(times.slice(1)),
			cancellationAckMs: stats(ack),
			replacementResultMs: stats(restart),
			elapsedMs: performance.now() - started,
			userAgent: navigator.userAgent,
			raw: { initializeMs: times, cancellationAckMs: ack, replacementResultMs: restart },
			limitations:
				'Diagnostic timings on this device/session; not a controlled mobile release benchmark.'
		};
	} finally {
		engine.dispose();
	}
}
