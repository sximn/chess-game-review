<script lang="ts">
	import Button from '#lib/components/ui/Button.svelte';
	import { onMount, tick } from 'svelte';
	import type { Move } from 'chess.js';
	import {
		ArrowDownUp,
		ChartNoAxesCombined,
		ChevronLeft,
		ChevronRight,
		Pause,
		Play,
		SkipBack,
		SkipForward
	} from 'lucide-svelte';
	import { moveLabel } from '#lib/chess.js';
	import GameActions from './GameActions.svelte';
	import MoveRating from './MoveRating.svelte';
	import BestMoveCard from './BestMoveCard.svelte';
	import VariationMoves from './VariationMoves.svelte';
	import type { MoveQuality } from '#lib/engine/classification.js';
	import type { ReviewState } from '#lib/engine/review.js';

	let {
		moves,
		ply,
		playing,
		compact,
		quality,
		reviewPhase,
		analysisDetail,
		suggestion,
		previewing,
		alternative,
		lineMoves,
		linePly,
		onToggleReveal,
		onExplore,
		onNavigate,
		onPlay,
		onFlip,
		onAnalysis,
		onExport
	}: {
		moves: Move[];
		ply: number;
		playing: boolean;
		compact: boolean;
		quality?: MoveQuality;
		reviewPhase: ReviewState['phase'];
		analysisDetail: boolean;
		suggestion?: Move;
		previewing: boolean;
		alternative: boolean;
		lineMoves: Move[];
		linePly?: number;
		onToggleReveal: () => void;
		onExplore: (ply: number) => void;
		onNavigate: (ply: number) => void;
		onPlay: () => void;
		onFlip: () => void;
		onAnalysis: () => void;
		onExport: () => void;
	} = $props();

	// Keep the outgoing moves mounted so returning to a move without an alternative
	// can finish the same collapse animation.
	let displayedLineMoves = $state<Move[]>([]);
	$effect(() => {
		if (lineMoves.length) displayedLineMoves = lineMoves;
	});
	const linePanelId = $props.id();
	let lineOpen = $derived(lineMoves.length > 0 && (previewing || linePly !== undefined));
	let carousel = $state<HTMLDivElement>();

	function center(animate: boolean) {
		const selected = carousel?.querySelector<HTMLButtonElement>('[aria-current="step"]');
		if (!carousel || !selected) return;
		carousel.scrollTo({
			left: selected.offsetLeft - (carousel.clientWidth - selected.offsetWidth) / 2,
			behavior:
				animate && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant'
		});
	}
	let centeredMoves: Move[] | undefined;
	$effect(() => {
		ply;
		const currentMoves = moves;
		const currentCarousel = carousel;
		let cancelled = false;
		// A game/branch change can update the chips and current ply in the same batch.
		// Wait for their aria-current attributes before reading the selected chip.
		void tick().then(() => {
			if (cancelled || !currentCarousel || currentCarousel !== carousel) return;
			center(centeredMoves === currentMoves);
			centeredMoves = currentMoves;
		});
		return () => {
			cancelled = true;
		};
	});
	onMount(() => {
		if (!carousel) return;
		const observer = new ResizeObserver(() => center(false));
		observer.observe(carousel);
		return () => observer.disconnect();
	});
</script>

<div class="move-controls" aria-label="Replay controls">
	<div class="replay-utilities">
		<div class="move-review-cards">
			<MoveRating
				{quality}
				move={moveLabel(ply, moves)}
				{ply}
				phase={reviewPhase}
				exploring={false}
				{analysisDetail}
			/>
			{#if suggestion}
				<BestMoveCard
					{suggestion}
					{previewing}
					{alternative}
					expanded={lineOpen}
					controls={linePanelId}
					onToggle={onToggleReveal}
				/>
			{/if}
		</div>
		<div class="replay-actions">
			<div class="playback-controls" role="group" aria-label="Automatic playback">
				<Button
					variant="ghost"
					size="icon-sm"
					class="replay-icon"
					aria-label="First move"
					title="First move"
					disabled={ply === 0 && linePly === undefined && !previewing}
					onclick={() => onNavigate(0)}
				>
					<SkipBack size={16} />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					class="replay-icon autoplay-button"
					aria-label={playing ? 'Pause replay' : 'Play replay'}
					title={playing ? 'Pause replay' : 'Play replay'}
					onclick={onPlay}
				>
					{#if playing}
						<Pause size={16} />
					{:else}
						<Play size={16} />
					{/if}
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					class="replay-icon"
					aria-label="Last move"
					title="Last move"
					disabled={ply === moves.length && linePly === undefined && !previewing}
					onclick={() => onNavigate(moves.length)}><SkipForward size={16} /></Button
				>
			</div>

			{#if compact}
				<GameActions {onExport} {onFlip} />

				<Button
					variant="secondary"
					size="sm"
					class="analysis-trigger"
					onclick={onAnalysis}
					aria-haspopup="dialog"
				>
					<ChartNoAxesCombined
						size={16}
						style="width:var(--analysis-icon-width);display:var(--analysis-icon-display)"
					/>
					<span>Analysis</span>
				</Button>
			{:else}
				<Button
					variant="ghost"
					size="icon"
					class="flip-button"
					aria-label="Flip board"
					title="Flip board"
					onclick={onFlip}><ArrowDownUp size={17} /></Button
				>
			{/if}
		</div>
	</div>

	<div
		id={linePanelId}
		class="variation-slot"
		class:open={lineOpen}
		inert={!lineOpen}
		aria-hidden={!lineOpen}
	>
		<div class="variation-content">
			<div class="variation-padding">
				{#if displayedLineMoves.length}
					<VariationMoves
						moves={displayedLineMoves}
						ply={linePly}
						{alternative}
						onNavigate={onExplore}
					/>
				{/if}
			</div>
		</div>
	</div>

	<div class="step-controls">
		<Button
			variant="outline"
			size="icon"
			class="previous-move"
			aria-label="Previous move"
			title="Previous move"
			disabled={ply === 0 && linePly === undefined && !previewing}
			onclick={() => onNavigate(ply - 1)}><ChevronLeft size={24} /></Button
		>
		<div class="move-carousel" bind:this={carousel} role="group" aria-label="Move timeline">
			<button
				class="move-chip"
				class:current={ply === 0}
				aria-current={ply === 0 ? 'step' : undefined}
				aria-label="Starting position"
				onclick={() => onNavigate(0)}>Start</button
			>
			{#each moves as move, index}
				<button
					class="move-chip"
					class:current={ply === index + 1}
					aria-current={ply === index + 1 ? 'step' : undefined}
					aria-label={`Select ${moveLabel(index + 1, moves)}`}
					onclick={() => onNavigate(index + 1)}
					><span>{move.before.split(' ')[5]}{move.color === 'w' ? '.' : '…'}</span
					>{move.san}</button
				>
			{/each}
		</div>
		<Button
			variant="primary"
			size="md"
			class="next-move"
			aria-label="Next move"
			disabled={ply === moves.length && linePly === undefined && !previewing}
			onclick={() => onNavigate(ply + 1)}
		>
			<span class="next-label">Next</span>
			<ChevronRight size={22} style="width:var(--next-icon-width)" />
		</Button>
	</div>
</div>

<style>
	.move-controls :global(.analysis-trigger) {
		--analysis-icon-width: 16px;
		--analysis-icon-display: inline;
	}
	.move-controls {
		flex: 0 0 auto;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
	.variation-slot {
		display: grid;
		grid-template-rows: 0fr;
		min-width: 0;
		opacity: 0;
		transition:
			grid-template-rows 280ms var(--ease),
			opacity 180ms ease;
	}
	.variation-slot.open {
		grid-template-rows: 1fr;
		opacity: 1;
	}
	.variation-content {
		min-height: 0;
		overflow: hidden;
	}
	.variation-padding {
		padding-top: 8px;
	}
	@media (prefers-reduced-motion: reduce) {
		.variation-slot {
			transition: none;
		}
	}
	.move-review-cards {
		/* Keep both tracks reserved even when there is no alternative. */
		flex: 0 1 340px;
		min-width: min(100%, 320px);
		max-width: 100%;
		display: grid;
		/* grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); */
		grid-template-columns: 1fr 1fr;
		align-items: start;
		gap: 8px;
	}
	.move-review-cards > :global(.card) {
		min-width: 0;
	}
	.step-controls {
		margin-top: 8px;
		height: 60px;
		flex-shrink: 0;
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) 90px;
		padding: 5px;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--paper);
		box-shadow: var(--shadow);
	}
	.step-controls > :global(.previous-move) {
		--button-width: auto;
		--button-height: 48px;
		--button-background: var(--paper-deep);
		--button-color: var(--text-action);
		--button-hover-background: var(--surface-green);
	}
	.move-carousel {
		height: 48px;
		min-width: 0;
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: none;
		overscroll-behavior-x: contain;
		touch-action: pan-x;
		scroll-snap-type: x proximity;
		padding: 0 4px;
	}
	.move-carousel::-webkit-scrollbar {
		display: none;
	}
	.move-chip {
		min-width: 68px;
		height: 39px;
		flex-shrink: 0;
		padding: 0 9px;
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		background: none;
		color: var(--muted);
		scroll-snap-align: center;
	}
	.move-chip > span {
		color: var(--text-secondary);
		font-size: var(--text-caption);
		font-weight: var(--weight-regular);
	}
	.move-chip.current {
		background: var(--active-bg);
		color: var(--active-text);
		border-color: var(--active-border);
		box-shadow: var(--highlight);
	}
	.move-chip.current > span {
		color: inherit;
	}
	.move-controls :global(.next-move) {
		--next-icon-width: 22px;
		--button-height: 48px;
		--button-min-height: 48px;
		--button-padding: 0 10px;
		--button-gap: 5px;
		--button-font-size: var(--text-sm);
		--button-radius: var(--radius-md);
	}
	.next-label {
		white-space: nowrap;
	}
	.replay-utilities {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 6px;
		min-height: 40px;
		padding: 0;
	}
	.replay-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		gap: 6px;
		margin-left: auto;
	}
	.playback-controls {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 1px;
		padding: 2px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper);
	}
	.playback-controls > :global(.replay-icon) {
		--button-width: 32px;
		--button-height: 32px;
		--button-color: var(--icon-muted);
		--button-hover-color: var(--icon-muted);
	}
	.playback-controls :global(.autoplay-button) {
		--button-background: var(--paper-deep);
		--button-color: var(--text-action);
		--button-hover-color: var(--text-action);
	}
	.replay-actions > :global(.flip-button) {
		--button-width: 34px;
		--button-height: 36px;
	}
	.replay-actions > :global(.analysis-trigger) {
		--button-height: 36px;
		--button-min-height: 36px;
		--button-padding: 0 11px;
		--button-font-size: var(--text-sm);
		--button-gap: 6px;
	}
	@media (hover: hover) {
		.move-chip:hover:not(.current) {
			background: var(--paper-deep);
			color: var(--ink);
		}
	}
	@media (min-width: 1200px) and (min-height: 620px) {
		.move-controls :global(.analysis-trigger) {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.step-controls {
			grid-template-columns: 40px minmax(0, 1fr) 76px;
			gap: 6px;
		}
		.move-chip {
			font-size: var(--text-sm);
			min-width: 64px;
			padding: 0 7px;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.move-controls {
			align-self: end;
			margin-bottom: 8px;
		}
		.step-controls {
			grid-template-columns: 32px minmax(0, 1fr) 58px;
			gap: 4px;
		}
		.move-controls :global(.next-move) {
			--button-padding: 0 4px;
			--button-gap: 1px;
			--button-font-size: var(--text-sm);
			--next-icon-width: 18px;
		}
		.step-controls > :global(.previous-move) {
			--button-width: 32px;
		}
		.replay-utilities {
			gap: 5px;
			padding: 0;
			flex-wrap: wrap;
			height: auto;
		}
		.playback-controls > :global(.replay-icon) {
			--button-width: 26px;
			--button-height: 30px;
		}
		.replay-actions > :global(.flip-button) {
			--button-width: 26px;
		}
		.replay-actions > :global(.analysis-trigger) {
			--button-padding: 0 7px;
			--button-font-size: var(--text-caption);
		}
		.move-controls :global(.analysis-trigger) {
			--analysis-icon-width: 13px;
		}
	}
	@media (max-height: 400px) and (min-width: 480px) and (max-width: 620px) {
		.replay-actions > :global(.analysis-trigger) {
			--analysis-icon-display: none;
		}
		.move-controls :global(.next-move) {
			--button-font-size: var(--text-caption);
		}
		.step-controls {
			grid-template-columns: 30px minmax(0, 1fr) 54px;
		}
	}

	/* EPERIMENTS */
	.move-controls {
		/* Main UX sizing control */
		--step-controls-height: 48px;

		--step-controls-padding: 5px;
		--step-controls-border: 1px;

		/* Available height inside the step-controls */
		--step-inner-height: calc(
			var(--step-controls-height) - var(--step-controls-padding) * 2 - var(--step-controls-border) *
				2
		);

		/* Preserve the current 39px chip / 48px button proportions */
		--move-chip-height: calc(var(--step-inner-height) * 0.8125);
	}

	.step-controls {
		box-sizing: border-box;
		height: var(--step-controls-height);
		padding: var(--step-controls-padding);
		border-width: var(--step-controls-border);
		align-items: center;
	}

	.step-controls > :global(.previous-move),
	.step-controls > :global(.next-move) {
		--button-height: var(--step-inner-height);
		--button-min-height: var(--step-inner-height);
	}

	.move-carousel {
		box-sizing: border-box;
		height: var(--step-inner-height);
		min-height: 0;
	}

	.move-chip {
		box-sizing: border-box;
		height: var(--move-chip-height);
		min-height: 0;
	}
	.replay-actions > :global(.analysis-trigger) {
		flex-shrink: 0;
	}
	.replay-utilities :global(.game-actions) {
		--button-width: 30px;
		--button-height: 36px;
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.replay-utilities {
			flex-wrap: wrap;
			row-gap: 4px;
		}
	}
</style>
