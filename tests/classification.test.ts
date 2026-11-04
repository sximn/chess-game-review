import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AnalysisResult, Score } from 'chess-engine-kit';
import { frozenightManifest } from 'chess-engine-kit/frozenight/manual';
import {
	classify,
	expectedPoints,
	qualityFromLoss,
	reviewRating,
	needsRefinement,
	MOVE_QUALITIES,
	getSymbolByQuality,
	getColorByQuality
} from '../src/lib/engine/classification.ts';
import { parseGame } from '../src/lib/chess.ts';
import { OPERA_PGN } from './fixtures/opera-game.ts';

const cp = (value: number): Score => ({ perspective: 'white', kind: 'cp', bound: 'exact', value });
const mate = (value: number): Score => ({
	perspective: 'white',
	kind: 'mate',
	bound: 'exact',
	value,
	unit: 'plies'
});
const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
function result(score: Score, rootMove = 'e2e4', second?: Score): AnalysisResult {
	return {
		...frozenightManifest.descriptor,
		settingsFingerprint: 'test',
		apiVersion: 1,
		jobId: 'test',
		positionId: 'same-root',
		elapsedMs: 1,
		sequence: 1,
		completedIteration: true,
		completion: 'completed',
		reason: 'depth',
		depth: 10,
		nodes: 1000,
		lines: [
			{ rank: 1, rootMove, pv: [rootMove], score },
			...(second ? [{ rank: 2, rootMove: 'd2d4', pv: ['d2d4'], score: second }] : [])
		]
	};
}

test('published expected-points bands use inclusive lower bounds', () => {
	for (const [loss, name] of [
		[0, 'Best'],
		[0.00001, 'Excellent'],
		[0.019999, 'Excellent'],
		[0.02, 'Good'],
		[0.049999, 'Good'],
		[0.05, 'Inaccuracy'],
		[0.099999, 'Inaccuracy'],
		[0.1, 'Mistake'],
		[0.199999, 'Mistake'],
		[0.2, 'Blunder'],
		[1, 'Blunder']
	] as const)
		assert.equal(qualityFromLoss(loss), name, String(loss));
});

test('evaluation loss is nonlinear, symmetric, and rating dependent', () => {
	assert.equal(expectedPoints(cp(0), 'w'), 0.5);
	assert.equal(expectedPoints(cp(0), 'b'), 0.5);
	assert.equal(expectedPoints(cp(250), 'w'), expectedPoints(cp(-250), 'b'));
	assert.ok(expectedPoints(cp(250), 'w', 2400)! > expectedPoints(cp(250), 'w', 800)!);
	for (const [value, name] of [
		[-10, 'Excellent'],
		[-50, 'Good'],
		[-100, 'Inaccuracy'],
		[-200, 'Mistake'],
		[-400, 'Blunder']
	] as const) {
		const white = classify(result(cp(0)), result(cp(value), 'd2d4'), 'w', 'd2d4', 0);
		const black = classify(result(cp(0), 'e7e5'), result(cp(-value), 'd7d5'), 'b', 'd7d5', 0);
		assert.equal(white.name, name);
		assert.equal(white.lossExpectedPoints, black.lossExpectedPoints);
		assert.equal(white.name, black.name);
	}
	const winning = classify(result(cp(2000)), result(cp(1600), 'd2d4'), 'w', 'd2d4', 0);
	assert.equal(winning.name, 'Excellent');
	assert.equal(winning.lossCp, 400);
	assert.equal(
		needsRefinement(winning),
		false,
		'large cp changes in won positions do not drive refinement'
	);
	const stronger = classify(result(cp(0)), result(cp(-300), 'd2d4'), 'w', 'd2d4', 0, false, {
		rating: 2400
	});
	const beginner = classify(result(cp(0)), result(cp(-300), 'd2d4'), 'w', 'd2d4', 0, false, {
		rating: 800
	});
	assert.equal(stronger.name, 'Blunder');
	assert.equal(beginner.name, 'Mistake');
});

test('PGN ratings have a stable fallback and bounded range', () => {
	for (const invalid of [undefined, '?', '-', '', '0', '1200?', NaN, Infinity, -5])
		assert.equal(reviewRating(invalid), 1200);
	assert.equal(reviewRating(' 1800 '), 1800);
	assert.equal(reviewRating('99'), 400);
	assert.equal(reviewRating('100'), 400);
	assert.equal(reviewRating(3500), 3000);
});

test('best roots and score ties are Best, favorable search noise is not a proven best move', () => {
	assert.equal(classify(result(cp(30)), result(cp(30)), 'w', 'e2e4', 0).name, 'Best');
	assert.equal(classify(result(cp(30)), result(cp(30), 'd2d4'), 'w', 'd2d4', 0).name, 'Best');
	const noisy = classify(result(cp(30)), result(cp(40), 'd2d4'), 'w', 'd2d4', 0);
	assert.equal(noisy.name, 'Excellent');
	assert.equal(noisy.noise, true);
	assert.equal(noisy.lossExpectedPoints, 0);
	assert.equal(needsRefinement(noisy), true);
	// Floating-point saturation at overwhelming scores must not manufacture a tie.
	assert.equal(
		classify(result(cp(100000)), result(cp(90000), 'd2d4'), 'w', 'd2d4', 0).name,
		'Excellent'
	);
});

test('mate scores use expected outcomes rather than fixed penalties', () => {
	assert.equal(expectedPoints(mate(3), 'w'), 1);
	assert.equal(expectedPoints(mate(3), 'b'), 0);
	assert.equal(expectedPoints(mate(-3), 'b'), 1);
	assert.equal(classify(result(mate(3)), result(cp(0), 'd2d4'), 'w', 'd2d4', 0).name, 'Blunder');
	assert.equal(
		classify(result(mate(3)), result(cp(2000), 'd2d4'), 'w', 'd2d4', 0).name,
		'Excellent'
	);
	assert.equal(
		classify(result(cp(-2000)), result(mate(-3), 'd2d4'), 'w', 'd2d4', 0).name,
		'Excellent'
	);
	assert.equal(
		classify(result(mate(3)), result(mate(5), 'd2d4'), 'w', 'd2d4', 0).lossExpectedPoints,
		0
	);
	const ambiguous = classify(result(mate(0)), result(cp(0), 'd2d4'), 'w', 'd2d4', 0, true);
	assert.equal(ambiguous.name, 'Uncertain');
	assert.equal(ambiguous.preliminary, true);
});

test('incomplete, bounded, different-root or mismatched-depth results remain uncertain', () => {
	const played = result(cp(-400), 'd2d4');
	for (const other of [
		{ ...played, completedIteration: false },
		{ ...played, depth: null },
		{ ...played, depth: 13 },
		{ ...played, depth: 0 },
		{ ...played, depth: -1 },
		{ ...played, depth: NaN },
		{ ...played, depth: 10.5 },
		{ ...played, positionId: 'other-root' },
		result(cp(-400), 'g1f3'),
		{ ...played, lines: [{ ...played.lines[0], score: { ...cp(-400), bound: 'upper' as const } }] }
	]) {
		const quality = classify(result(cp(0)), other, 'w', 'd2d4', 0, true);
		assert.equal(quality.name, 'Uncertain');
		assert.equal(quality.lossExpectedPoints, null);
		assert.equal(quality.preliminary, true);
	}
});

test('Great requires an only-good-move comparison, not merely the top engine move', () => {
	const best = result(cp(0), 'e2e4', cp(-300));
	assert.equal(classify(best, best, 'w', 'e2e4', 0, false, { fen: start }).name, 'Great');
	for (const second of [undefined, cp(-20)]) {
		const ordinary = result(cp(0), 'e2e4', second);
		assert.equal(classify(ordinary, ordinary, 'w', 'e2e4', 0, false, { fen: start }).name, 'Best');
	}
	const forced = result(cp(0), 'a1b1', cp(-300));
	assert.equal(
		classify(forced, forced, 'w', 'a1b1', 0, false, { fen: 'r7/8/8/8/8/2k5/8/K7 w - - 0 1' }).name,
		'Best'
	);
});

test('Brilliant recognizes the Opera queen sacrifice with a legal mate continuation', () => {
	const timeline = parseGame(OPERA_PGN);
	const best = result(mate(3), 'b3b8', cp(0));
	best.lines[1] = { rank: 2, rootMove: 'b3e6', pv: ['b3e6'], score: cp(0) };
	best.lines[0].pv = timeline.moves.slice(30).map((m) => m.lan);
	const score = (candidate: AnalysisResult, played = candidate) =>
		classify(candidate, played, 'w', 'b3b8', 30, true, { fen: timeline.fens[30] });
	assert.equal(score(best).name, 'Brilliant');
	assert.equal(needsRefinement(score(best)), true);
	const short = structuredClone(best);
	short.lines[0].pv = short.lines[0].pv.slice(0, 2);
	assert.notEqual(score(short).name, 'Brilliant');
	const illegal = structuredClone(best);
	illegal.lines[0].pv[1] = 'a7a4';
	assert.notEqual(score(illegal).name, 'Brilliant');
	const alreadyWon = structuredClone(best);
	alreadyWon.lines[1].score = cp(2000);
	assert.notEqual(score(alreadyWon).name, 'Brilliant');
	const losing = structuredClone(best);
	losing.lines[0].score = cp(-500);
	assert.notEqual(score(losing).name, 'Brilliant');
	const badSacrifice = structuredClone(best);
	badSacrifice.lines[0].score = cp(-100);
	const better = structuredClone(best);
	better.lines[0].rootMove = 'b3f3';
	assert.notEqual(score(better, badSacrifice).name, 'Brilliant');
	// A normal bishop exchange invests no material, even with a favorable score.
	const game = parseGame('1. d4 d5 2. Bf4 Bf5 3. e3 e6 4. Bd3 Bxd3 5. Qxd3 Nf6 6. Nf3 Bd6 *');
	const exchange = result(cp(200), game.moves[6].lan, cp(0));
	exchange.lines[1] = { rank: 2, rootMove: 'g1f3', pv: ['g1f3'], score: cp(0) };
	exchange.lines[0].pv = game.moves.slice(6).map((m) => m.lan);
	assert.notEqual(
		classify(exchange, exchange, 'w', exchange.lines[0].rootMove, 6, false, { fen: game.fens[6] })
			.name,
		'Brilliant'
	);
});

test('Miss requires a new winning opportunity created by the preceding opponent error', () => {
	const previousBest = result(cp(0), 'e7e5');
	const previous = {
		quality: classify(previousBest, result(cp(600), 'd7d5'), 'b', 'd7d5', 0),
		bestScore: cp(0),
		playedScore: cp(600)
	};
	const best = result(cp(600));
	const played = result(cp(0), 'd2d4');
	const score = (context = { previous }) => classify(best, played, 'w', 'd2d4', 1, false, context);
	assert.equal(score().name, 'Miss');
	assert.equal(classify(best, played, 'w', 'd2d4', 1).name, 'Blunder');
	assert.equal(
		score({ previous: { ...previous, bestScore: cp(600) } }).name,
		'Blunder',
		'a preexisting win is not a newly missed opportunity'
	);
	assert.equal(
		score({ previous: { ...previous, quality: { ...previous.quality, lossExpectedPoints: 0.02 } } })
			.name,
		'Blunder'
	);
	assert.equal(
		score({ previous: { ...previous, quality: { ...previous.quality, rootPly: 4 } } }).name,
		'Blunder'
	);
	assert.notEqual(
		classify(best, result(cp(500), 'd2d4'), 'w', 'd2d4', 1, false, { previous }).name,
		'Miss'
	);
});

test('every classification has a symbol and marker color', () => {
	assert.equal(MOVE_QUALITIES.length, 10);
	for (const name of MOVE_QUALITIES) {
		assert.ok(getSymbolByQuality(name));
		assert.match(getColorByQuality(name), /^#[0-9a-f]{6}$/);
	}
});

test('numeric PGN ratings are clamped consistently with numeric input', () => {
	for (const value of [1, 99, 1200, 3500, 10000]) {
		assert.equal(reviewRating(String(value)), reviewRating(value));
	}
	assert.equal(reviewRating(1200.5), 1200);
});

test('invalid scores and probability losses cannot produce confident classifications', () => {
	for (const value of [NaN, Infinity, -Infinity]) {
		assert.equal(expectedPoints(cp(value), 'w'), null);
		const quality = classify(result(cp(0)), result(cp(value), 'd2d4'), 'w', 'd2d4', 0, true);
		assert.equal(quality.name, 'Uncertain');
		assert.equal(quality.lossExpectedPoints, null);
	}
	assert.equal(expectedPoints({ ...cp(100), bound: 'lower' }, 'w'), null);
	for (const loss of [NaN, Infinity, -0.1, 1.01]) assert.equal(qualityFromLoss(loss), 'Uncertain');
});

test('mate improvements are search noise even when expected points are unchanged', () => {
	for (const [best, played, mover] of [
		[mate(5), mate(3), 'w'],
		[mate(-5), mate(-3), 'b'],
		[mate(-3), mate(-5), 'w'],
		[mate(3), mate(5), 'b'],
		[cp(100000), mate(3), 'w'],
		[cp(-100000), mate(-3), 'b']
	] as const) {
		const quality = classify(result(best), result(played, 'd2d4'), mover, 'd2d4', 0, true);
		assert.equal(quality.noise, true);
		assert.equal(quality.preliminary, true, 'unresolved noise must not be presented as reliable');
		assert.equal(quality.name, 'Excellent');
	}
});

test('disagreeing searches of the same move do not manufacture zero loss', () => {
	for (const value of [-400, 400]) {
		const quality = classify(result(cp(0)), result(cp(value)), 'w', 'e2e4', 0, true);
		assert.equal(quality.name, 'Uncertain');
		assert.equal(quality.lossExpectedPoints, null);
		assert.equal(quality.preliminary, true);
	}
});

test('Brilliant compares a nearly best sacrifice with the best remaining alternative', () => {
	const timeline = parseGame(OPERA_PGN);
	const best = result(cp(820), 'b3e6', cp(800));
	best.lines[1] = {
		rank: 2,
		rootMove: 'b3b8',
		score: cp(800),
		pv: timeline.moves.slice(30).map((m) => m.lan)
	};
	const played = result(cp(800), 'b3b8');
	played.lines[0].pv = best.lines[1].pv;
	const quality = classify(best, played, 'w', 'b3b8', 30, true, { fen: timeline.fens[30] });
	assert.equal(
		quality.name,
		'Excellent',
		'the unplayed top move is already overwhelmingly winning'
	);
});

test('an even exchange followed by an unrelated loss is not a piece sacrifice', () => {
	const best = result(cp(0), 'a1a7', cp(0));
	best.lines[0].pv = ['a1a7', 'a8a7', 'f3h4', 'c5c4', 'g1h2', 'c4b3'];
	best.lines[1] = { rank: 2, rootMove: 'f3h4', pv: ['f3h4'], score: cp(0) };
	const quality = classify(best, best, 'w', 'a1a7', 0, true, {
		fen: 'k7/r7/8/2p5/8/1B3N2/8/R5K1 w - - 0 1'
	});
	assert.equal(quality.name, 'Best');
});

test('invalid or mismatched board context cannot crash review or award special labels', () => {
	const best = result(cp(0), 'e2e4', cp(-300));
	for (const fen of ['bad FEN', start.replace(' w ', ' b ')]) {
		assert.equal(classify(best, best, 'w', 'e2e4', 0, false, { fen }).name, 'Best');
	}
	best.lines[1].rootMove = 'a1a8';
	assert.equal(classify(best, best, 'w', 'e2e4', 0, false, { fen: start }).name, 'Best');
});

test('a Miss requires the preceding comparison to show a newly winning opportunity', () => {
	const previous = {
		quality: classify(result(cp(0), 'e7e5'), result(cp(300), 'd7d5'), 'b', 'd7d5', 0),
		bestScore: cp(0),
		playedScore: cp(300)
	};
	const quality = classify(result(cp(600)), result(cp(0), 'd2d4'), 'w', 'd2d4', 1, true, {
		previous
	});
	assert.equal(
		quality.name,
		'Blunder',
		'a later search finding a win is not evidence that the prior move created one'
	);
});

test('valid nearly best sacrifices still qualify for both colors', () => {
	const timeline = parseGame(OPERA_PGN);
	const pv = timeline.moves.slice(30).map((m) => m.lan);
	const mirrorMove = (move: string) =>
		move[0] + (9 - Number(move[1])) + move[2] + (9 - Number(move[3])) + move.slice(4);
	const mirrorFen = (fen: string) => {
		const parts = fen.split(' ');
		return (
			parts[0]
				.split('/')
				.reverse()
				.join('/')
				.replace(/[a-z]/gi, (piece) =>
					piece === piece.toUpperCase() ? piece.toLowerCase() : piece.toUpperCase()
				) + ' b - - 0 16'
		);
	};
	for (const mover of ['w', 'b'] as const) {
		const transform = mover === 'w' ? (move: string) => move : mirrorMove;
		const sign = mover === 'w' ? 1 : -1;
		const best = result(cp(30 * sign), transform('b3e6'));
		const played = result(cp(20 * sign), transform('b3b8'));
		played.lines[0].pv = pv.map(transform);
		const quality = classify(best, played, mover, transform('b3b8'), 30, true, {
			fen: mover === 'w' ? timeline.fens[30] : mirrorFen(timeline.fens[30])
		});
		assert.equal(quality.name, 'Brilliant');
		assert.ok(quality.lossExpectedPoints! > 0);
		assert.equal(quality.preliminary, false);
	}
});

test('a Miss retains preliminary status until its opponent-error evidence is refined', () => {
	const previous = {
		quality: classify(result(cp(0), 'e7e5'), result(cp(600), 'd7d5'), 'b', 'd7d5', 0),
		bestScore: cp(0),
		playedScore: cp(600)
	};
	for (const preliminary of [true, false]) {
		const quality = classify(result(cp(600)), result(cp(0), 'd2d4'), 'w', 'd2d4', 1, true, {
			previous: { ...previous, quality: { ...previous.quality, preliminary } }
		});
		assert.equal(quality.name, 'Miss');
		assert.equal(quality.preliminary, preliminary);
	}
});
