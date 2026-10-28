import { Chess } from 'chess.js';
import type { Move } from 'chess.js';

export const DEMO_PGN = `[Event "The Opera Game"]
[Site "Paris, France"]
[Date "1858.??.??"]
[White "Paul Morphy"]
[Black "Duke & Count"]
[Result "1-0"]

1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6
7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7
12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8# 1-0`;

export type SavedGame = { id: string; pgn: string; addedAt: string };
export type Timeline = { moves: Move[]; fens: string[]; headers: Record<string, string> };

export function parseGame(pgn: string): Timeline {
	if (typeof pgn !== 'string' || !pgn.trim())
		throw new Error('Paste a PGN or choose a .pgn file to get started.');
	if (typeof pgn !== 'string' || new TextEncoder().encode(pgn).length > 1_048_576)
		throw new Error('Please import a single game no larger than 1 MiB.');
	const game = new Chess();
	try {
		game.loadPgn(pgn);
	} catch {
		throw new Error('That PGN could not be read. Check the move notation and try again.');
	}
	const moves = game.history({ verbose: true });
	if (moves.length > 2000)
		throw new Error('Please import a game with no more than 2,000 half-moves.');
	if (!moves.length) throw new Error('This PGN has no moves yet. Try a completed game.');
	return {
		moves,
		fens: [moves[0].before, ...moves.map((move) => move.after)],
		headers: game.getHeaders()
	};
}

export const demoAnalysis = [
	{ name: 'Brilliant', symbol: '!!', color: '#138f91', white: 2, black: 0, plies: [25, 31] },
	{ name: 'Great', symbol: '!', color: '#7062ee', white: 3, black: 1, plies: [19, 21, 29] },
	{
		name: 'Best',
		symbol: '★',
		color: '#648c51',
		white: 9,
		black: 7,
		plies: [3, 5, 7, 9, 11, 15, 17, 23, 33]
	},
	{ name: 'Inaccuracy', symbol: '?!', color: '#b48a00', white: 1, black: 4, plies: [13] },
	{ name: 'Mistake', symbol: '?', color: '#d57824', white: 0, black: 2, plies: [14, 18] },
	{ name: 'Blunder', symbol: '??', color: '#d74442', white: 0, black: 1, plies: [28] }
];

export const demoEvaluations = [
	0.2, 0.2, 0.2, 0.1, 0.3, 0.3, 0.5, 0.4, 0.6, 0.4, 0.5, 0.2, 0.3, 0.1, 0.8, 0.6, 0.8, 0.7, 1.8,
	1.7, 2.1, 2.0, 2.2, 2.1, 2.8, 2.7, 3.1, 3.0, 4.3, 4.1, 6.0, 6.1, 9, 10
];

export function moveLabel(ply: number, moves: Move[]) {
	const move = moves[ply - 1];
	return move
		? `${move.before.split(' ')[5]}.${move.color === 'b' ? '..' : ''} ${move.san}`
		: 'Starting position';
}
