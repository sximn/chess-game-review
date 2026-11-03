<script lang="ts">
	import type { MoveQuality } from '#lib/engine/classification.js';
	import type { ReviewState } from '#lib/engine/review.js';
	import Card from '#lib/components/ui/Card.svelte';
	import { qualityTextColor } from '#lib/components/analysis/quality-colors.js';

	let {
		quality,
		move,
		ply,
		phase,
		exploring,
		analysisDetail
	}: {
		quality?: MoveQuality;
		move: string;
		ply: number;
		phase: ReviewState['phase'];
		exploring: boolean;
		analysisDetail: boolean;
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
				? ''
				: `${move}${analysisDetail && quality ? ` · ${quality.preliminary ? 'Preliminary' : 'Refined'}` : ''}`
	);
</script>

<Card
	class="move-rating"
	variant="paper"
	aria-label="Current move rating"
	style={`--card-radius:var(--radius-md);--rating-color:${!exploring && ply > 0 && quality ? quality.color : 'var(--muted)'};--rating-text:${!exploring && ply > 0 && quality ? qualityTextColor(quality.name) : 'var(--muted)'}`}
>
	<div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
		{label}. {detail}
	</div>

	<div class="rating-content">
		<span class="rating-symbol" aria-hidden="true">
			{!exploring && ply > 0 && quality ? quality.symbol : '·'}
		</span>

		<span class="rating-copy">
			<strong title={label}>
				{label}
			</strong>
			<span title={detail}>{detail}</span>
		</span>
	</div>
</Card>

<style>
	.rating-content {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-width: 0;
		height: 48px;
		padding: 10px 12px;
		background: transparent;
		text-align: left;
		border-radius: inherit;
	}
	.rating-symbol {
		display: grid;
		place-items: center;
		flex: 0 0 28px;
		height: 28px;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--rating-color) 12%, var(--paper));
		color: var(--rating-text);
		font-size: var(--text-lg);
		font-weight: var(--weight-bold);
	}
	.rating-copy {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 2px;
	}
	.rating-copy strong {
		display: block;
		font-size: var(--text-sm);
		line-height: var(--leading-tight);
		color: var(--rating-text);
	}
	.rating-copy > span {
		font-size: var(--text-sm);
		color: var(--muted);
		line-height: var(--leading-compact);
	}
	.rating-copy > strong,
	.rating-copy > span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	@media (max-width: 360px) {
		.rating-symbol {
			display: none;
		}
	}
</style>
