<script lang="ts">
	import { app } from '#lib/state.svelte.js';
	import { pieceSrc } from '#lib/pieces.js';
	import type { Color, PieceSymbol } from 'chess.js';

	const pieces: Record<number, [Color, PieceSymbol]> = {
		14: ['b', 'k'],
		27: ['b', 'p'],
		36: ['w', 'n'],
		53: ['w', 'k']
	};
</script>

<div class="welcome-board" aria-hidden="true">
	{#each Array.from({ length: 64 }, (_, i) => i) as square}
		<div class="square" class:dark={(Math.floor(square / 8) + (square % 8)) % 2 === 1}>
			{#if pieces[square]}
				<img src={pieceSrc(app.pieceSet, ...pieces[square])} alt="" draggable="false" />
			{/if}
		</div>
	{/each}
</div>

<style>
	.welcome-board {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		width: min(280px, 100%);
		aspect-ratio: 1;
		padding: 7px;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--paper);
		box-shadow: 0 12px 32px -20px #00000033;
		overflow: hidden;
	}
	.square {
		display: grid;
		place-items: center;
		aspect-ratio: 1;
		background: var(--board-light);
	}
	.square.dark {
		background: var(--board-dark);
	}
	img {
		width: 88%;
		height: 88%;
	}
	@media (max-width: 760px) {
		.welcome-board {
			width: min(clamp(140px, calc(100svh - 400px), 232px), 100%);
			flex-shrink: 0;
		}
	}
</style>
