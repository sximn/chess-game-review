<script lang="ts">
	import { ArrowUpRight, ChevronRight } from 'lucide-svelte';
	import type { Move } from 'chess.js';
	import type { ReviewState } from '#lib/engine/review.js';
	import { moveLabel } from '#lib/chess.js';

	let {
		suggestion,
		playedMove,
		phase,
		onExplore
	}: {
		suggestion?: Move;
		playedMove?: Move;
		phase: ReviewState['phase'];
		onExplore: () => void;
	} = $props();
	let sameMove = $derived(suggestion && playedMove && suggestion.lan === playedMove.lan);
</script>

<div class="best-move-reveal">
	{#if suggestion}
		<div class="move-comparison">
			<div class="played-choice">
				<span>Played</span><strong>{playedMove ? moveLabel(1, [playedMove]) : '—'}</strong>
			</div>
			<div class="best-choice">
				<span><ArrowUpRight size={12} /> Best move</span><strong
					>{moveLabel(1, [suggestion])}</strong
				>
			</div>
		</div>
		<div class="reveal-footer">
			<span>{sameMove ? 'You found the best move.' : 'Arrow shows the best alternative.'}</span
			><button onclick={onExplore}>Explore line <ChevronRight size={13} /></button>
		</div>
	{:else}
		<p class="suggestion-pending" role="status">
			{phase === 'error'
				? 'Best move unavailable. Open Analysis to retry.'
				: phase === 'paused'
					? 'Open Analysis and resume the review to see the best move.'
					: phase === 'complete'
						? 'No best move is available for this position.'
						: 'Finding the best move…'}
		</p>
	{/if}
</div>

<style>
	.best-move-reveal {
		border-top: 1px solid var(--line);
		padding: 10px;
	}
	.reveal-footer > span {
		font-size: 10px;
		color: var(--muted);
		line-height: 1.4;
	}
	button {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		gap: 2px;
		min-height: 36px;
		padding: 0 7px;
		border-radius: 7px;
		background: var(--surface-green);
		color: var(--ink);
		font-size: 10px;
		font-weight: 650;
	}
	.move-comparison {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.move-comparison > div {
		border-radius: 8px;
		padding: 8px 10px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.move-comparison span {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 10px;
		color: var(--muted);
	}
	.move-comparison strong {
		font-size: 15px;
	}
	.played-choice {
		background: var(--paper-deep);
	}
	.best-choice {
		background: var(--surface-green);
		border: 1px solid color-mix(in srgb, var(--sage) 30%, var(--line));
	}
	.best-choice span {
		color: var(--sage);
	}
	.reveal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding-top: 8px;
	}
	.suggestion-pending {
		font-size: 11px;
		line-height: 1.5;
		color: var(--muted);
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.move-comparison > div {
			padding: 6px;
		}
		.move-comparison strong {
			font-size: 12px;
		}
		.reveal-footer {
			flex-wrap: wrap;
		}
	}
</style>
