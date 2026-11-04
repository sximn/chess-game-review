import { Chess } from 'chess.js';
import type { AnalysisResult, Score } from 'chess-engine-kit';

const styles = {
	Brilliant: ['!!', '#26a6a6'],
	Great: ['!', '#5b8cba'],
	Best: ['★', '#648c51'],
	Excellent: ['✓', '#81a16c'],
	Good: ['✓', '#648c51'],
	Inaccuracy: ['?!', '#b48a00'],
	Mistake: ['?', '#d57824'],
	Miss: ['✕', '#d57824'],
	Blunder: ['??', '#d74442'],
	Uncertain: ['…', '#858c77']
} as const;

export const MOVE_QUALITIES = Object.keys(styles) as (keyof typeof styles)[];
export const EXPECTED_POINTS_CUTOFFS = [0.02, 0.05, 0.1, 0.2] as const;
export const DEFAULT_REVIEW_RATING = 1200;

export type MoveQuality = {
	name: keyof typeof styles;
	symbol: string;
	color: string;
	lossCp: number | null;
	expectedPointsBefore: number | null;
	expectedPointsAfter: number | null;
	lossExpectedPoints: number | null;
	rating: number;
	preliminary: boolean;
	noise: boolean;
	alternative: string[];
	rootPly: number;
	comparedDepths: [number | null, number | null];
};

export type ClassificationContext = {
	rating?: number | string;
	fen?: string;
	previous?: { quality: MoveQuality; bestScore: Score };
};

export function reviewRating(value?: number | string): number {
	const rating =
		typeof value === 'string' && /^\d{3,4}$/.test(value.trim())
			? Number(value)
			: typeof value === 'number'
				? value
				: NaN;
	return Number.isFinite(rating) && rating > 0
		? Math.min(3000, Math.max(400, rating))
		: DEFAULT_REVIEW_RATING;
}

// Local estimate, not Chess.com's unpublished fitted model. Higher ratings make
// the same advantage more decisive. Scores stay in White's perspective in the SDK.
export function expectedPoints(score: Score, mover: 'w' | 'b', rating = DEFAULT_REVIEW_RATING) {
	const value = score.value * (mover === 'w' ? 1 : -1);
	if (score.kind === 'mate') return value === 0 ? null : value > 0 ? 1 : 0;
	const scale = 400 - (reviewRating(rating) - 400) / 13;
	return 1 / (1 + Math.exp(-value / scale));
}

// Lower bounds are inclusive; zero loss is Best only for an actual score tie.
// A search that rates the played move above the best is noise, not a proven tie.
export function qualityFromLoss(loss: number): MoveQuality['name'] {
	return loss >= 0.2
		? 'Blunder'
		: loss >= 0.1
			? 'Mistake'
			: loss >= 0.05
				? 'Inaccuracy'
				: loss >= 0.02
					? 'Good'
					: loss === 0
						? 'Best'
						: 'Excellent';
}

export function needsRefinement(quality: MoveQuality) {
	const loss = quality.lossExpectedPoints;
	return (
		quality.name === 'Uncertain' ||
		quality.noise ||
		['Brilliant', 'Great', 'Miss'].includes(quality.name) ||
		(loss !== null &&
			(loss >= 0.04 || EXPECTED_POINTS_CUTOFFS.some((cutoff) => Math.abs(loss - cutoff) <= 0.01)))
	);
}

export function getSymbolByQuality(quality: MoveQuality['name']) {
	return styles[quality][0];
}

export function getColorByQuality(quality: MoveQuality['name']) {
	return styles[quality][1];
}

function material(game: Chess, mover: 'w' | 'b') {
	const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
	return game
		.board()
		.flat()
		.reduce(
			(sum, piece) => sum + (piece ? values[piece.type] * (piece.color === mover ? 1 : -1) : 0),
			0
		);
}

// Conservative sacrifice evidence: the played non-pawn is captured immediately
// in a legal PV, and a material investment survives the next few moves. Ordinary
// exchanges, pawn sacrifices, truncated recaptures and forced moves do not qualify.
function isPieceSacrifice(fen: string, pv: string[], mover: 'w' | 'b', rating: number) {
	try {
		const game = new Chess(fen);
		const before = material(game, mover);
		let offered = false;
		for (let i = 0; i < Math.min(6, pv.length); i++) {
			const uci = pv[i];
			const move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
			if (i === 0 && (move.color !== mover || move.piece === 'p' || move.piece === 'k'))
				return false;
			if (i === 1)
				offered = !!move.captured && move.captured !== 'p' && move.to === pv[0].slice(2, 4);
		}
		if (pv.length < 6 && !game.isGameOver()) return false;
		return offered && before - material(game, mover) >= (rating < 1200 ? 1 : 2);
	} catch {
		return false;
	}
}

export function classify(
	best: AnalysisResult,
	played: AnalysisResult,
	mover: 'w' | 'b',
	playedMove: string,
	rootPly: number,
	refined = false,
	context: ClassificationContext = {}
): MoveQuality {
	const first = best.lines[0];
	const actual = played.lines[0];
	const rating = reviewRating(context.rating);
	let name: MoveQuality['name'] = 'Uncertain';
	let lossCp: number | null = null;
	let before: number | null = null;
	let after: number | null = null;
	let loss: number | null = null;
	let noise = false;
	const sign = mover === 'w' ? 1 : -1;
	const comparable = !!(
		best.completedIteration &&
		played.completedIteration &&
		best.positionId === played.positionId &&
		actual?.rootMove === playedMove &&
		first?.score.bound === 'exact' &&
		actual?.score.bound === 'exact' &&
		best.depth !== null &&
		played.depth !== null &&
		Math.abs(best.depth - played.depth) <= 2
	);

	if (first && actual && comparable) {
		before = expectedPoints(first.score, mover, rating);
		after = expectedPoints(actual.score, mover, rating);
		if (before !== null && after !== null) {
			const isBest = first.rootMove === playedMove;
			const tied =
				first.score.kind === actual.score.kind && first.score.value === actual.score.value;
			noise =
				!isBest &&
				(first.score.kind === 'cp' && actual.score.kind === 'cp'
					? (first.score.value - actual.score.value) * sign < 0
					: after > before);
			if (isBest) after = before;
			loss = Math.max(0, before - after);
			if (first.score.kind === 'cp' && actual.score.kind === 'cp') {
				lossCp = isBest ? 0 : Math.max(0, (first.score.value - actual.score.value) * sign);
			}
			name = isBest || tied ? 'Best' : noise || loss === 0 ? 'Excellent' : qualityFromLoss(loss);

			// Special labels require evidence beyond a centipawn delta. The rating
			// dependent bands and sacrifice detector are intentionally local heuristics.
			const winning = 0.75 + (rating - 400) / 26000;
			const previous = context.previous;
			if (
				!noise &&
				previous &&
				previous.quality.rootPly === rootPly - 1 &&
				previous.quality.lossExpectedPoints !== null &&
				previous.quality.lossExpectedPoints >= 0.1 &&
				before >= winning &&
				after <= 0.55
			) {
				const prior = expectedPoints(previous.bestScore, mover, rating);
				if (prior !== null && prior < winning) name = 'Miss';
			}

			const second = best.lines[1];
			if (
				!noise &&
				loss < 0.02 &&
				context.fen &&
				second?.rank === 2 &&
				second.rootMove !== first.rootMove &&
				second.score.bound === 'exact'
			) {
				const other = expectedPoints(second.score, mover, rating);
				const legalMoves = new Chess(context.fen).moves().length;
				if (other !== null && legalMoves > 1) {
					if (
						isBest &&
						after >= 0.45 &&
						((other < 0.45 && after - other >= 0.1) || (after >= winning && other <= 0.55))
					) {
						name = 'Great';
					}
					if (
						after >= 0.45 &&
						other < 0.9 + (rating - 400) / 52000 &&
						isPieceSacrifice(context.fen, actual.pv, mover, rating)
					)
						name = 'Brilliant';
				}
			}
		}
	}
	return {
		name,
		symbol: styles[name][0],
		color: styles[name][1],
		lossCp,
		expectedPointsBefore: before,
		expectedPointsAfter: after,
		lossExpectedPoints: loss,
		rating,
		preliminary: !refined || !comparable || loss === null,
		noise,
		alternative: first?.pv ?? [],
		rootPly,
		comparedDepths: [best.depth, played.depth]
	};
}

export function formatScore(score: Score | undefined, winner?: 'white' | 'black' | null) {
	if (!score) {
		return '—';
	}

	const prefix = score.bound === 'lower' ? '≥' : score.bound === 'upper' ? '≤' : '';
	if (score.kind === 'mate') {
		return score.value === 0
			? winner
				? `${winner === 'white' ? 'White' : 'Black'} mates`
				: 'Checkmate'
			: `${prefix}${score.value < 0 ? '−' : ''}M${Math.ceil(Math.abs(score.value) / 2)}`;
	}

	return `${prefix}${score.value > 0 ? '+' : ''}${(score.value / 100).toFixed(2)}`;
}

export function visualValue(result: AnalysisResult | undefined): number | null {
	if (!result) {
		return null;
	}

	if (result.outcome === 'checkmate') {
		return result.winner === 'white' ? Infinity : -Infinity;
	}

	const score = result.terminalScore ?? result.lines[0]?.score;
	if (!score) {
		return null;
	}

	return score.kind === 'mate' ? (score.value > 0 ? Infinity : -Infinity) : score.value / 100;
}
