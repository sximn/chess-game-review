import { Chess } from 'chess.js';
import type { Timeline } from '../chess.ts';
export function continuation(fen: string, pv: string[]) {
	const game = new Chess(fen);
	const moves = pv.map((move) =>
		game.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] })
	);
	return {
		moves,
		fens: [fen, ...moves.map((move) => move.after)],
		sans: moves.map(
			(move) => `${move.before.split(' ')[5]}.${move.color === 'b' ? '..' : ''} ${move.san}`
		)
	};
}
export function branchTimeline(timeline: Timeline, ply: number, pv: string[]): Timeline {
	const line = continuation(timeline.fens[ply], pv);
	return { moves: line.moves, fens: line.fens, headers: timeline.headers };
}
