import { parseGame, type Timeline } from '../chess.ts';
import { createReviewEngine } from './provider.ts';
import { ResultCache, resultKey } from './cache.ts';
import { classify, type MoveQuality } from './classification.ts';
import {
	API_VERSION,
	EngineError,
	type AnalyzeRequest,
	type AnalysisResult,
	type SearchLimits,
	type Position,
	type ChessEngine
} from 'chess-engine-kit';
import { isCachedResult } from './cached-result.ts';

export const QUICK_LIMITS: SearchLimits = { maxNodes: 30_000, maxTimeMs: 750 };
export const SELECTED_LIMITS: SearchLimits = { maxNodes: 100_000, maxTimeMs: 1500 };
const DEEP_LIMITS: SearchLimits = { maxNodes: 150_000, maxTimeMs: 2000 };

export class ReviewError extends Error {
	readonly code = 'INVALID_PGN';
	readonly retryable = false;
}

function comparisonLimits(limits: SearchLimits, depth: number | null): SearchLimits {
	return depth === null ? limits : { ...limits, maxDepth: Math.max(1, depth) };
}

export type ReviewState = {
	phase: 'idle' | 'loading' | 'reviewing' | 'refining' | 'paused' | 'complete' | 'error';
	positions: (AnalysisResult | undefined)[];
	alternatives: (AnalysisResult | undefined)[];
	qualities: (MoveQuality | undefined)[];
	selectedLive?: AnalysisResult;
	selectedPly: number;
	scored: number;
	total: number;
	error?: { code: string; message: string; retryable: boolean };
	warning: string;
	activeJob?: string;
};

export const emptyReview = (): ReviewState => ({
	phase: 'idle',
	positions: [],
	alternatives: [],
	qualities: [],
	selectedPly: 0,
	scored: 0,
	total: 0,
	warning: ''
});

export class ReviewController {
	state: ReviewState = emptyReview();
	private timeline?: Timeline;
	private epoch = 0;
	private revision = 0;
	private foregroundJob?: string;
	private sequence = 0;
	private busy = false;
	private paused = false;
	private visible = true;
	private disposed = false;
	private selectedDemand = true;
	private quick: (AnalysisResult | undefined)[] = [];
	private refined = new Set<number>();
	private cache = new ResultCache();
	private unsubscribe: () => void;
	private update: (state: ReviewState) => void;
	readonly engine: ChessEngine;
	constructor(update: (state: ReviewState) => void, engine: ChessEngine = createReviewEngine()) {
		this.update = update;
		this.engine = engine;
		this.unsubscribe = engine.onEvent((event) => {
			if (
				event.type === 'progress' &&
				this.foregroundJob === event.result.jobId &&
				event.result.positionId === this.positionId(this.state.selectedPly)
			) {
				this.state.selectedLive = event.result;
				this.publish();
			}
		});
	}
	private publish() {
		if (this.disposed) return;
		this.state.warning = this.cache.warning;
		this.update({
			...this.state,
			positions: [...this.state.positions],
			alternatives: [...this.state.alternatives],
			qualities: [...this.state.qualities]
		});
	}
	private positionId(ply: number) {
		return `game-${this.epoch}-ply-${ply}`;
	}
	private position(ply: number): Position {
		return {
			rootFen: this.timeline!.fens[0],
			movesUci: this.timeline!.moves.slice(0, ply).map((m) => m.lan)
		};
	}
	reviewGame(pgn: string, options: { selectedPly?: number } = {}) {
		let timeline: Timeline;
		try {
			timeline = parseGame(pgn);
		} catch (error) {
			throw new ReviewError((error as Error).message);
		}
		this.epoch++;
		this.revision++;
		this.engine.reset();
		this.timeline = timeline;
		this.quick = [];
		this.refined.clear();
		this.paused = false;
		this.selectedDemand = true;
		this.state = {
			...emptyReview(),
			phase: 'loading',
			selectedPly: Math.min(timeline.moves.length, Math.max(0, options.selectedPly ?? 0)),
			total: timeline.fens.length
		};
		this.publish();
		this.schedule();
	}
	selectPosition(ply: number) {
		if (!this.timeline) return;
		const selected = Math.min(this.timeline.moves.length, Math.max(0, Math.floor(ply)));
		if (selected === this.state.selectedPly && !this.state.error) return;
		this.revision++;
		this.state.selectedPly = selected;
		this.state.selectedLive = undefined;
		this.state.error = undefined;
		this.selectedDemand = true;
		if (this.state.activeJob) this.engine.cancel(this.state.activeJob);
		this.publish();
		this.schedule();
	}
	pauseReview() {
		this.revision++;
		this.paused = true;
		if (this.state.activeJob) this.engine.cancel(this.state.activeJob);
		this.state.phase = 'paused';
		this.publish();
	}
	resumeReview() {
		this.paused = false;
		this.state.error = undefined;
		this.selectedDemand = true;
		this.schedule();
	}
	setVisible(visible: boolean) {
		this.visible = visible;
		if (!visible) {
			this.revision++;
			if (this.state.activeJob) this.engine.cancel(this.state.activeJob);
			this.state.phase = 'paused';
			this.publish();
		} else if (!this.paused) this.schedule();
	}
	retry() {
		this.state.error = undefined;
		this.state.phase = 'loading';
		this.selectedDemand = true;
		this.schedule();
	}
	dispose() {
		this.disposed = true;
		this.epoch++;
		this.unsubscribe();
		this.engine.dispose();
		this.cache.dispose();
	}
	private schedule() {
		if (
			this.busy ||
			this.disposed ||
			!this.timeline ||
			this.paused ||
			!this.visible ||
			this.state.error
		)
			return;
		void this.pump();
	}
	private async search(
		ply: number,
		limits: SearchLimits,
		multiPv = 1,
		rootMoves?: string[],
		foreground = false
	) {
		const epoch = this.epoch,
			revision = this.revision;
		const request: AnalyzeRequest = {
			apiVersion: API_VERSION,
			jobId: `review-${epoch}-${++this.sequence}`,
			positionId: this.positionId(ply),
			position: this.position(ply),
			limits,
			multiPv,
			...(rootMoves ? { rootMoves } : {})
		};
		const key = await resultKey(request, this.engine.identity);
		const cached = await this.cache.get(key);
		if (
			epoch !== this.epoch ||
			revision !== this.revision ||
			this.paused ||
			!this.visible ||
			this.disposed
		)
			throw new EngineError('CANCELLED', 'Review paused.', true);
		if (isCachedResult(cached, request, this.engine.identity))
			return { ...cached, jobId: request.jobId, positionId: request.positionId };
		this.state.activeJob = request.jobId;
		if (foreground) this.foregroundJob = request.jobId;
		this.publish();
		const result = await this.engine.analyzePosition(request);
		if (epoch !== this.epoch || revision !== this.revision)
			throw new EngineError('CANCELLED', 'Game changed.', true);
		await this.cache.put(key, result);
		return result;
	}
	private async pump() {
		this.busy = true;
		const epoch = this.epoch;
		try {
			await this.engine.initialize();
			while (
				!this.disposed &&
				epoch === this.epoch &&
				!this.paused &&
				this.visible &&
				!this.state.error
			) {
				if (this.selectedDemand) {
					this.selectedDemand = false;
					const ply = this.state.selectedPly;
					this.state.phase = 'reviewing';
					this.publish();
					const result = await this.search(ply, SELECTED_LIMITS, 3, undefined, true);
					if (epoch !== this.epoch) break;
					if (ply === this.state.selectedPly) {
						this.state.alternatives[ply] = result;
						this.state.selectedLive = undefined;
					}
					this.publish();
					continue;
				}
				let classified = false;
				for (let ply = 1; ply <= this.timeline!.moves.length; ply++) {
					if (this.state.qualities[ply] || !this.quick[ply - 1]) continue;
					const move = this.timeline!.moves[ply - 1],
						best = this.quick[ply - 1]!;
					const played =
						best.lines[0]?.rootMove === move.lan
							? best
							: await this.search(ply - 1, comparisonLimits(QUICK_LIMITS, best.depth), 1, [
									move.lan
								]);
					if (epoch !== this.epoch) break;
					this.state.qualities[ply] = classify(best, played, move.color, move.lan, ply - 1);
					classified = true;
					this.publish();
					break;
				}
				if (epoch !== this.epoch) break;
				if (classified) continue;
				const missing = Array.from({ length: this.state.total }, (_, i) => i).find(
					(i) => !this.quick[i]
				);
				if (missing !== undefined) {
					this.state.phase = 'reviewing';
					const result = await this.search(missing, QUICK_LIMITS);
					if (epoch !== this.epoch) break;
					this.quick[missing] = result;
					this.state.positions[missing] = result;
					this.state.scored = this.quick.filter(Boolean).length;
					this.publish();
					continue;
				}
				const deepen = this.state.qualities.findIndex(
					(q, i) =>
						q &&
						!this.refined.has(i) &&
						(q.name === 'Uncertain' ||
							(q.lossCp !== null &&
								(q.lossCp >= 40 || [50, 100, 250].some((t) => Math.abs(q.lossCp! - t) <= 20))) ||
							(q.lossCp === null && ['Mistake', 'Blunder'].includes(q.name)))
				);
				if (deepen >= 1) {
					this.state.phase = 'refining';
					this.publish();
					const move = this.timeline!.moves[deepen - 1];
					const best = await this.search(deepen - 1, DEEP_LIMITS),
						played =
							best.lines[0]?.rootMove === move.lan
								? best
								: await this.search(deepen - 1, comparisonLimits(DEEP_LIMITS, best.depth), 1, [
										move.lan
									]);
					if (epoch !== this.epoch) break;
					this.state.qualities[deepen] = classify(
						best,
						played,
						move.color,
						move.lan,
						deepen - 1,
						true
					);
					this.refined.add(deepen);
					this.state.positions[deepen - 1] = best;
					this.publish();
					if (['Mistake', 'Blunder'].includes(this.state.qualities[deepen]!.name)) {
						const alternatives = await this.search(deepen - 1, DEEP_LIMITS, 3);
						if (epoch !== this.epoch) break;
						this.state.alternatives[deepen - 1] = alternatives;
						this.publish();
					}
					continue;
				}
				this.state.phase = 'complete';
				this.state.activeJob = undefined;
				this.publish();
				break;
			}
		} catch (error) {
			if (epoch === this.epoch && !this.disposed) {
				const e =
					error instanceof EngineError
						? error
						: new EngineError('ENGINE_CRASHED', 'Review stopped unexpectedly.', true);
				if (e.code !== 'CANCELLED') {
					this.state.phase = 'error';
					this.state.error = { code: e.code, message: e.message, retryable: e.retryable };
					this.publish();
				} else this.selectedDemand = true;
			}
		} finally {
			this.busy = false;
			if (epoch === this.epoch) this.state.activeJob = undefined;
			if (
				!this.disposed &&
				(epoch !== this.epoch || this.selectedDemand) &&
				!this.paused &&
				this.visible &&
				!this.state.error
			)
				this.schedule();
		}
	}
}
