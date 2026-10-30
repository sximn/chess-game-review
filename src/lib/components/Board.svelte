<script lang="ts">
	import { Chess } from 'chess.js';
	import type { Move } from 'chess.js';
	import { app } from '#lib/state.svelte.js';
	let {
		fen,
		flipped = false,
		lastMove,
		evaluation = null,
		marker = '',
		evaluationLabel = '—'
	}: {
		fen: string;
		flipped?: boolean;
		lastMove?: Move;
		evaluation?: number | null;
		marker?: string;
		evaluationLabel?: string;
	} = $props();
	const pieceNames: Record<string, string> = {
		k: 'king',
		q: 'queen',
		r: 'rook',
		b: 'bishop',
		n: 'knight',
		p: 'pawn'
	};
	let position = $derived(new Chess(fen));
	let squares = $derived.by(() => {
		const board = position.board().flat();
		return Array.from({ length: 64 }, (_, i) => {
			const index = flipped ? 63 - i : i;
			const square = `${'abcdefgh'[index % 8]}${8 - Math.floor(index / 8)}`;
			return { square, piece: board[index], dark: (Math.floor(index / 8) + (index % 8)) % 2 !== 0 };
		});
	});
</script>

<div class="board-with-eval">
	{#if app.showEvaluation}
		<div
			class="evaluation-rail"
			class:flipped
			aria-label={evaluation === null
				? 'Evaluation unavailable'
				: `White perspective: ${evaluationLabel}`}
		>
			<div
				class="eval-white"
				style:height={`${evaluation === null ? 50 : 50 + 46 * Math.tanh(evaluation / 3)}%`}
			></div>
			<span>{evaluation === null ? '–' : evaluationLabel}</span>
		</div>
	{/if}
	<div
		class="chessboard"
		role="img"
		aria-label={`Chess position. ${position.turn() === 'w' ? 'White' : 'Black'} to move${position.isCheckmate() ? ', checkmate' : position.isCheck() ? ', check' : ''}.`}
	>
		{#each squares as square, i (square.square)}
			<div
				class="square"
				class:dark={square.dark}
				class:last-move={square.square === lastMove?.from || square.square === lastMove?.to}
				class:king-check={square.piece?.type === 'k' &&
					square.piece?.color === position.turn() &&
					position.isCheck()}
			>
				{#if app.coordinates && i % 8 === 0}<span class="rank-label">{square.square[1]}</span>{/if}
				{#if app.coordinates && i >= 56}<span class="file-label">{square.square[0]}</span>{/if}
				{#if square.piece}
					<img
						src={`/pieces/${square.piece.color}${square.piece.type.toUpperCase()}.svg`}
						alt={`${square.piece.color === 'w' ? 'White' : 'Black'} ${pieceNames[square.piece.type]} on ${square.square}`}
						draggable="false"
					/>
				{/if}
				{#if marker && square.square === lastMove?.to}<span class="board-marker">{marker}</span
					>{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.board-with-eval {
		display: flex;
		align-items: stretch;
		gap: 9px;
		width: 100%;
	}
	.evaluation-rail {
		width: 12px;
		flex-shrink: 0;
		border-radius: 4px;
		background: #414b38;
		position: relative;
		overflow: hidden;
		border: 1px solid #626c502a;
	}
	.eval-white {
		background: var(--board-light);
		position: absolute;
		bottom: 0;
		width: 100%;
		transition: height 0.35s;
	}
	.evaluation-rail > span {
		position: absolute;
		bottom: 8px;
		left: 0;
		right: 0;
		text-align: center;
		color: #4b5540;
		font-size: 6px;
		font-weight: 800;
		writing-mode: vertical-rl;
		display: block;
		margin: auto;
	}
	.evaluation-rail.flipped {
		transform: rotate(180deg);
	}
	.evaluation-rail.flipped > span {
		transform: rotate(180deg);
	}
	.chessboard {
		width: 100%;
		aspect-ratio: 1;
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		grid-template-rows: repeat(8, 1fr);
		border-radius: 5px;
		box-shadow:
			0 0 0 1px #6d79552b,
			0 3px 5px #3c46200e;
		overflow: hidden;
		user-select: none;
		min-width: 0;
		flex: 1;
	}
	.square {
		position: relative;
		background: var(--board-light);
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		min-width: 0;
	}
	.square.dark {
		background: var(--board-dark);
	}
	.square.last-move {
		background: #d8d58b;
	}
	.square.dark.last-move {
		background: #b8bf70;
	}
	.square.king-check {
		background:
			radial-gradient(ellipse, #db6357 0%, #d8776266 45%, transparent 80%), var(--board-light);
	}
	.square img {
		width: 85%;
		height: 85%;
		filter: drop-shadow(0 2px 1px #262e1b22);
		z-index: 1;
		object-fit: contain;
	}
	.rank-label,
	.file-label {
		font-size: 8px;
		color: #71845b;
		font-weight: 650;
		position: absolute;
		z-index: 2;
		line-height: 1;
	}
	.square.dark .rank-label,
	.square.dark .file-label {
		color: #e7ebd1;
	}
	.rank-label {
		left: 4px;
		top: 4px;
	}
	.file-label {
		right: 4px;
		bottom: 4px;
	}
	.board-marker {
		position: absolute;
		right: 0;
		top: 0;
		z-index: 3;
		border-radius: 50%;
		background: var(--violet);
		border: 1.5px solid #f9fae9;
		color: #fff;
		display: grid;
		place-items: center;
		font-size: 14px;
		font-weight: 800;
		line-height: 1;
		width: 24px;
		height: 24px;
		box-shadow: 0 2px 4px #0002;
	}
	@media (max-width: 760px) {
		.square img {
			width: 87%;
			height: 87%;
		}
		.rank-label,
		.file-label {
			font-size: 7px;
		}
		.rank-label {
			top: 3px;
			left: 3px;
		}
		.file-label {
			right: 3px;
			bottom: 3px;
		}
	}
</style>
