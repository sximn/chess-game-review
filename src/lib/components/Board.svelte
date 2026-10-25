<script lang="ts">
	import { Chess } from 'chess.js';
	import type { Move } from 'chess.js';
	import { app } from '#lib/state.svelte.js';
	let {
		fen,
		flipped = false,
		lastMove,
		evaluation = null,
		marker = ''
	}: {
		fen: string;
		flipped?: boolean;
		lastMove?: Move;
		evaluation?: number | null;
		marker?: string;
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
				: `White advantage ${evaluation.toFixed(1)}`}
		>
			<div
				class="eval-white"
				style:height={`${evaluation === null ? 50 : Math.min(94, Math.max(6, 50 + evaluation * 7))}%`}
			></div>
			<span>{evaluation === null ? '–' : evaluation >= 9 ? 'M1' : evaluation.toFixed(1)}</span>
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
