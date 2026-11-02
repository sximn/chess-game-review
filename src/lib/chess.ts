import { Chess } from 'chess.js';
import type { Move } from 'chess.js';

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

export function moveLabel(ply: number, moves: Move[]) {
	const move = moves[ply - 1];
	return move
		? `${move.before.split(' ')[5]}.${move.color === 'b' ? '..' : ''} ${move.san}`
		: 'Starting position';
}
