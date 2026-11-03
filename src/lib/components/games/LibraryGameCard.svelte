<script lang="ts">
	import { ChevronRight } from 'lucide-svelte';
	import type { SavedGame, Timeline } from '#lib/chess.js';
	import { rememberReviewPosition } from '#lib/state.svelte.js';

	let {
		game
	}: {
		game: SavedGame & Timeline;
	} = $props();

	let result = $derived(
		game.headers.Result === '1-0'
			? 'White won'
			: game.headers.Result === '0-1'
				? 'Black won'
				: game.headers.Result === '1/2-1/2'
					? 'Draw'
					: 'Unfinished'
	);
</script>

<a
	href={`/review?game=${encodeURIComponent(game.id)}`}
	class="library-game"
	onclick={() => rememberReviewPosition(game.id, 0)}
>
	<div class="game-info">
		<h3>{game.headers.White || 'White'} <span>vs</span> {game.headers.Black || 'Black'}</h3>
		<p>
			{Math.ceil(game.moves.length / 2)} moves{#if game.headers.Event && game.headers.Event !== '?'}<span
					>·</span
				>{game.headers.Event}{/if}
		</p>
	</div>
	<div class="game-result"><strong>{result}</strong><span>Review game</span></div>
	<ChevronRight size={18} />
</a>

<style>
	.library-game {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 22px 24px;
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		transition:
			background 0.18s,
			border-color 0.18s;
	}
	.game-info {
		flex: 1;
		min-width: 0;
	}
	h3 {
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-body);
		overflow-wrap: anywhere;
	}
	h3 span {
		color: var(--muted);
		font-weight: var(--weight-regular);
		margin: 0 4px;
		font-size: var(--text-sm);
	}
	p {
		color: var(--muted);
		font-size: var(--text-sm);
		margin-top: 5px;
		line-height: var(--leading-body);
		overflow-wrap: anywhere;
	}
	p span {
		margin: 0 7px;
	}
	.game-result {
		text-align: right;
		flex-shrink: 0;
	}
	.game-result strong {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}
	.game-result > span {
		display: block;
		font-size: var(--text-sm);
		color: var(--muted);
		margin-top: 6px;
	}
	a > :global(svg) {
		color: var(--muted);
	}
	@media (hover: hover) {
		.library-game:hover {
			background: var(--surface-green);
			border-color: var(--sage);
		}
	}
	@media (max-width: 760px) {
		.library-game {
			padding: 18px 16px;
			gap: 12px;
		}
		h3 {
			font-size: var(--text-md);
		}
		p {
			font-size: var(--text-sm);
		}
		.game-result strong {
			font-size: var(--text-sm);
		}
		a > :global(svg) {
			width: 14px;
		}
	}
</style>
