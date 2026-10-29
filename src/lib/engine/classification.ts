import type { AnalysisResult, Score } from 'chess-engine-kit';

export type MoveQuality = {
	name: 'Best' | 'Good' | 'Inaccuracy' | 'Mistake' | 'Blunder' | 'Uncertain';
	symbol: string;
	color: string;
	lossCp: number | null;
	preliminary: boolean;
	noise: boolean;
	alternative: string[];
	rootPly: number;
	comparedDepths: [number | null, number | null];
};

const styles = {
	Best: ['★', '#648c51'],
	Good: ['✓', '#648c51'],
	Inaccuracy: ['?!', '#b48a00'],
	Mistake: ['?', '#d57824'],
	Blunder: ['??', '#d74442'],
	Uncertain: ['…', '#858c77']
} as const;

export function classify(
	best: AnalysisResult,
	played: AnalysisResult,
	mover: 'w' | 'b',
	playedMove: string,
	rootPly: number,
	refined = false
): MoveQuality {
	const first = best.lines[0];
	const actual = played.lines[0];

	let name: MoveQuality['name'] = 'Uncertain',
		lossCp: number | null = null,
		noise = false;

	const sign = mover === 'w' ? 1 : -1;

	const comparable =
		best.completedIteration &&
		played.completedIteration &&
		first?.score.bound === 'exact' &&
		actual?.score.bound === 'exact' &&
		best.depth !== null &&
		played.depth !== null &&
		Math.abs(best.depth - played.depth) <= 2;

	if (first && actual && comparable) {
		if (first.rootMove === playedMove) {
			name = 'Best';
			lossCp = 0;
		} else if (first.score.kind === 'cp' && actual.score.kind === 'cp') {
			const loss = (first.score.value - actual.score.value) * sign;
			noise = loss < 0;
			lossCp = Math.max(0, loss);
			name =
				lossCp >= 250
					? 'Blunder'
					: lossCp >= 100
						? 'Mistake'
						: lossCp >= 50
							? 'Inaccuracy'
							: 'Good';
		} else {
			const winningMate = (s: Score) => s.kind === 'mate' && s.value * sign > 0;
			const losingMate = (s: Score) => s.kind === 'mate' && s.value * sign < 0;
			name =
				!losingMate(first.score) && losingMate(actual.score)
					? 'Blunder'
					: winningMate(first.score) && !winningMate(actual.score)
						? 'Mistake'
						: 'Good';
		}
	}
	return {
		name,
		symbol: styles[name][0],
		color: styles[name][1],
		lossCp,
		preliminary: !refined || !comparable,
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
