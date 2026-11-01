<script lang="ts">
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import type { Move } from 'chess.js';
	import Card from '#lib/components/ui/Card.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import { moveLabel } from '#lib/chess.js';
	import { getColorByQuality, getSymbolByQuality } from '#lib/engine/classification.js';

	let {
		suggestion,
		expanded,
		onToggle,
		onExplore
	}: {
		suggestion: Move;
		expanded: boolean;
		onToggle: () => void;
		onExplore: () => void;
	} = $props();
	const exploreId = $props.id();
</script>

<Card
	style={`--card-background:rgba(from var(--paper) r g b / 10%);--rating-color:${getColorByQuality("Best")}`}
>
	<button
		class="best-move-trigger"
		onclick={onToggle}
		aria-expanded={expanded}
		aria-controls={exploreId}
		aria-label={`${expanded ? 'Hide' : 'Show'} best-move preview: ${moveLabel(1, [suggestion])}`}
	>
		<span class="rating-symbol" aria-hidden="true">
			{getSymbolByQuality('Best')}
		</span>
		<span class="best-move-copy">
			<strong>Best</strong>
			<span title={suggestion.san}>{suggestion.san}</span>
		</span>

		<ChevronRight size={14} class={expanded ? 'expanded-chevron' : ''} />
	</button>

	<div id={exploreId} hidden={!expanded}>
		{#if expanded}
			<div class="explore-action">
				<Button variant="ghost" size="sm" class="explore-best-line" onclick={onExplore}
					>Explore line <ChevronRight size={14} /></Button
				>
			</div>
		{/if}
	</div>
</Card>

<style>
	.best-move-trigger {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		min-width: 0;
		height: 48px;
		padding: 10px 12px;
		border-radius: 11px;
		background: transparent;
		text-align: left;
	}
	.rating-symbol {
		flex-shrink: 0;
		background: color-mix(in srgb, var(--rating-color) 20%, var(--paper));
		color: var(--rating-color);
		display: grid;
		place-items: center;
		flex: 0 0 28px;
		height: 28px;
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
		color: var(--rating-color);
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
	.best-move-trigger :global(.expanded-chevron) {
		transform: rotate(90deg);
	}
	.explore-action {
		border-top: 1px solid var(--line);
		padding: 4px 6px;
	}
	.explore-action :global(.explore-best-line) {
		--button-width: 100%;
		--button-font-size: 11px;
		--button-padding: 0 6px;
		--button-color: var(--ink);
	}
	@media (max-width: 360px), (max-height: 520px) and (min-width: 480px) {
		.best-move-trigger {
			gap: 5px;
			padding: 10px 8px;
		}
		.best-move-trigger > :global(svg:first-child) {
			display: none;
		}
		.best-move-copy strong {
			font-size: 11px;
		}
		.best-move-copy > span {
			font-size: 11px;
		}
	}
</style>
