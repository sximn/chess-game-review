<script lang="ts">
	import { ArrowUpRight } from 'lucide-svelte';
	import type { Move } from 'chess.js';
	import Card from '#lib/components/ui/Card.svelte';
	import { moveLabel } from '#lib/chess.js';
	import { getColorByQuality, getSymbolByQuality } from '#lib/engine/classification.js';
	import { qualityTextColor } from '#lib/components/analysis/quality-colors.js';

	let {
		suggestion,
		previewing,
		expanded,
		controls,
		alternative = false,
		onToggle
	}: {
		suggestion: Move;
		previewing: boolean;
		expanded: boolean;
		controls: string;
		alternative?: boolean;
		onToggle: () => void;
	} = $props();
</script>

<Card
	class="best-move-card"
	style={`--card-background:rgba(from var(--paper) r g b / 10%);--rating-color:${getColorByQuality('Best')};--rating-text:${qualityTextColor('Best')}`}
>
	<button
		class="best-move-trigger"
		onclick={onToggle}
		aria-pressed={previewing}
		aria-expanded={expanded}
		aria-controls={controls}
		aria-label={`${previewing ? 'Hide' : 'Show'} ${alternative ? 'alternative' : 'best-move'} preview: ${moveLabel(1, [suggestion])}`}
	>
		<span class="rating-symbol" aria-hidden="true">
			{getSymbolByQuality('Best')}
		</span>
		<span class="best-move-copy">
			<strong>{alternative ? 'Alternative' : 'Best move'}</strong>
			<span title={suggestion.san}>{suggestion.san}</span>
		</span>

		<ArrowUpRight size={15} />
	</button>
</Card>

<style>
	.best-move-trigger {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		min-width: 0;
		height: 48px;
		padding: 10px;
		border-radius: 11px;
		background: transparent;
		text-align: left;
	}
	.best-move-trigger[aria-pressed='true'] {
		background: var(--active-bg);
	}
	.rating-symbol {
		flex-shrink: 0;
		background: color-mix(in srgb, var(--rating-color) 20%, var(--paper));
		color: var(--rating-text);
		display: grid;
		place-items: center;
		flex: 0 0 24px;
		height: 24px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 750;
	}
	.best-move-copy {
		display: flex;
		flex: 1;
		min-width: 0;
		flex-direction: column;
		gap: 3px;
	}
	.best-move-copy strong {
		display: block;
		font-size: 12px;
		line-height: 1.2;
		color: var(--rating-text);
	}
	.best-move-copy > span {
		font-size: 12px;
		color: var(--muted);
		line-height: 1.3;
	}
	.best-move-copy > strong,
	.best-move-copy > span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.best-move-trigger > :global(svg) {
		flex-shrink: 0;
	}
	@media (max-width: 360px), (max-height: 520px) and (min-width: 480px) {
		.best-move-trigger {
			gap: 5px;
			padding: 10px 8px;
		}
		.best-move-trigger > :global(svg) {
			display: none;
		}
		.best-move-copy strong {
			font-size: 11px;
		}
		.best-move-copy > span {
			font-size: 11px;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.rating-symbol {
			display: none;
		}
	}
</style>
