<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import type { MoveQuality } from '#lib/engine/classification.js';
	import type { ReviewState } from '#lib/engine/review.js';
	import Card from '../ui/Card.svelte';

	let {
		quality,
		move,
		ply,
		phase,
		exploring,
		analysisDetail,
		expanded,
		controlsId,
		onToggle
	}: {
		quality?: MoveQuality;
		move: string;
		ply: number;
		phase: ReviewState['phase'];
		exploring: boolean;
		analysisDetail: boolean;
		expanded: boolean;
		controlsId: string;
		onToggle: () => void;
	} = $props();

	let label = $derived(
		exploring
			? 'Alternative line'
			: ply === 0
				? 'Starting position'
				: (quality?.name ??
					(phase === 'error'
						? 'Rating unavailable'
						: phase === 'paused'
							? 'Review paused'
							: phase === 'complete'
								? 'Not rated'
								: 'Analyzing…'))
	);
	let detail = $derived(
		exploring
			? 'Return to game for ratings'
			: ply === 0
				? 'Play a move to see its rating'
				: `${move}${analysisDetail && quality ? ` · ${quality.preliminary ? 'Preliminary' : 'Refined'}` : ''}`
	);
	let canReveal = $derived(ply > 0 && !exploring);
</script>

<div
	class="move-rating"
	style:--rating-color={!exploring && ply > 0 && quality ? quality.color : 'var(--muted)'}
>
	<div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
		{label}. {detail}
	</div>

	<button
		class="rating-content"
		onclick={onToggle}
		disabled={!canReveal}
		aria-expanded={expanded}
		aria-controls={controlsId}
		aria-label={`${expanded ? 'Hide' : 'Show'} best move: ${label}. ${detail}`}
	>
		<span class="rating-symbol" aria-hidden="true"
			>{!exploring && ply > 0 && quality ? quality.symbol : '·'}</span
		>
		<span class="rating-copy">
			<strong>
				{label}
				{#if canReveal}
					<ChevronDown
						size={13}
						class={expanded ? 'expanded-chevron' : ''}
					/>
				{/if}
			</strong>
			<span>{detail}</span>
		</span>
	</button>
</div>

<style>
	.move-rating {
		min-width: 0;
		flex: 1;
	}
	.rating-content {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-width: 0;
		min-height: 40px;
		padding: 0 2px;
		background: transparent;
		text-align: left;
		border-radius: 8px;
	}
	.rating-content:disabled {
		opacity: 1;
		cursor: default;
	}
	.rating-symbol {
		display: grid;
		place-items: center;
		flex: 0 0 28px;
		height: 28px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--rating-color) 12%, var(--paper));
		color: var(--rating-color);
		font-size: 15px;
		font-weight: 750;
	}
	.rating-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 2px;
	}
	.rating-copy strong {
		display: flex;
		align-items: center;
		gap: 3px;
		font-size: 12px;
		line-height: 1.2;
		color: var(--rating-color);
	}
	.rating-copy > span {
		font-size: 10px;
		color: var(--muted);
		line-height: 1.3;
	}
	.rating-copy :global(.expanded-chevron) {
		transform: rotate(180deg);
	}
	@media (max-width: 360px) {
		.rating-symbol {
			display: none;
		}
		.rating-copy strong {
			font-size: 11px;
		}
		.rating-copy > span {
			font-size: 9px;
		}
	}
</style>
