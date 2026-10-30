import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';
import { DEMO_PGN, parseGame, moveLabel } from '../src/lib/chess.ts';

test('the sample replays to the Opera Game checkmate, one legal position per half-move', () => {
	const game = parseGame(DEMO_PGN);
	assert.equal(game.moves.length, 33);
	assert.equal(game.fens.length, 34);
	assert.equal(game.moves[18].san, 'Nxb5');
	for (let index = 0; index < game.moves.length; index++) {
		const position = new Chess(game.fens[index]);
		position.move(game.moves[index].san);
		assert.equal(position.fen(), game.fens[index + 1]);
	}
	assert.equal(new Chess(game.fens.at(-1)).isCheckmate(), true);
});

test('imports plain notation and preserves PGN player metadata', () => {
	const game = parseGame('[White "Ada"]\n[Black "Grace"]\n\n1. e4 e5 2. Nf3 Nc6 *');
	assert.equal(game.headers.White, 'Ada');
	assert.equal(game.headers.Black, 'Grace');
	assert.equal(game.moves.length, 4);
	assert.equal(moveLabel(4, game.moves), '2... Nc6');
	assert.equal(moveLabel(0, game.moves), 'Starting position');
});

test('imports custom starting positions without assuming the standard initial board', () => {
	const game = parseGame('[SetUp "1"]\n[FEN "8/8/8/8/8/3k4/8/3K4 w - - 0 1"]\n\n1. Kc1 Ke2 *');
	assert.equal(game.fens[0], '8/8/8/8/8/3k4/8/3K4 w - - 0 1');
	assert.equal(game.moves.length, 2);
});

test('rejects empty, malformed, moveless, and oversized PGNs with useful errors', () => {
	assert.throws(() => parseGame(''), /Paste a PGN/);
	assert.throws(() => parseGame('1. e4 e5 2. Qz9'), /could not be read/);
	assert.throws(() => parseGame('[White "Ada"]'), /no moves/);
	assert.throws(() => parseGame('a'.repeat(1_048_577)), /1 MiB/);
});

test('uses the PGN starting side and full-move number in move labels', () => {
	const game = parseGame(
		'[SetUp "1"]\n[FEN "8/8/8/8/8/3k4/8/3K4 b - - 0 23"]\n\n23... Kc4 24. Kc1 *'
	);
	assert.equal(moveLabel(1, game.moves), '23... Kc4');
	assert.equal(moveLabel(2, game.moves), '24. Kc1');
});
