<script lang="ts">
	import Button from './Button.svelte';
	import { onMount } from 'svelte';
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

	let {
		moves,
		ply,
		playing,
		compact,
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
		onNavigate: (ply: number) => void;
		onPlay: () => void;
		onFlip: () => void;
		onAnalysis: () => void;
		onExport: () => void;
	} = $props();

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
	$effect(() => {
		ply;
		moves;
		if (carousel) center(true);
	});
	onMount(() => {
		if (!carousel) return;
		const observer = new ResizeObserver(() => center(false));
		observer.observe(carousel);
		return () => observer.disconnect();
	});
</script>

<div class="move-controls" aria-label="Replay controls">
	<div class="step-controls">
		<Button
			variant="outline"
			size="icon"
			class="previous-move"
			aria-label="Previous move"
			title="Previous move"
			disabled={ply === 0}
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
			class="replay-action next-move"
			aria-label="Next move"
			disabled={ply === moves.length}
			onclick={() => onNavigate(ply + 1)}
		>
			<span class="next-label">Next</span>
			<ChevronRight size={22} style="width:var(--next-icon-width)" />
		</Button>
	</div>
	<div class="replay-utilities">
		<div class="playback-controls" role="group" aria-label="Automatic playback">
			<Button
				variant="ghost"
				size="icon-sm"
				class="replay-icon"
				aria-label="First move"
				title="First move"
				disabled={ply === 0}
				onclick={() => onNavigate(0)}><SkipBack size={16} /></Button
			>
			<Button
				variant="ghost"
				size="icon-sm"
				class="replay-icon autoplay-button"
				aria-label={playing ? 'Pause replay' : 'Play replay'}
				title={playing ? 'Pause replay' : 'Play replay'}
				onclick={onPlay}
				>{#if playing}<Pause size={16} />{:else}<Play size={16} />{/if}</Button
			>
			<Button
				variant="ghost"
				size="icon-sm"
				class="replay-icon"
				aria-label="Last move"
				title="Last move"
				disabled={ply === moves.length}
				onclick={() => onNavigate(moves.length)}><SkipForward size={16} /></Button
			>
		</div>
		<span class="replay-counter">{ply}<span> / {moves.length}</span></span>
		<Button
			variant="ghost"
			size="icon"
			class="replay-icon flip-button"
			aria-label="Flip board"
			title="Flip board"
			onclick={onFlip}
		>
			<ArrowDownUp size={17} />
		</Button>
		{#if compact}
			<GameActions {onExport} />

			<Button
				variant="secondary"
				size="sm"
				class="replay-action analysis-trigger"
				onclick={onAnalysis}
				aria-haspopup="dialog"
			>
				<ChartNoAxesCombined
					size={16}
					style="width:var(--analysis-icon-width);display:var(--analysis-icon-display)"
				/>
				<span>Analysis</span>
			</Button>
		{/if}
	</div>
</div>

<style>
	.move-controls :global(.analysis-trigger) {
		--analysis-icon-width: 16px;
		--analysis-icon-display: inline;
	}
	.move-controls {
		flex: 0 0 108px;
		height: 108px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.step-controls {
		height: 60px;
		flex-shrink: 0;
		display: grid;
		grid-template-columns: 44px minmax(0, 1fr) 90px /*105px*/;
		/* gap: 8px; */
		padding: 5px;
		border: 1px solid var(--line);
		border-radius: 13px;
		background: var(--paper);
		box-shadow: var(--shadow);
	}
	.step-controls > :global(.previous-move) {
		--button-width: auto;
		--button-height: 48px;
		--button-background: var(--paper-deep);
		--button-color: #7d8d69;
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
		border-radius: 8px;
		border: 1px solid transparent;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		font-size: 13px;
		font-weight: 650;
		background: none;
		color: var(--muted);
		scroll-snap-align: center;
	}
	.move-chip > span {
		color: #a1aa91;
		font-size: 9px;
		font-weight: 450;
	}
	.move-chip.current {
		background: var(--surface-green);
		color: #637a4f;
		border-color: #cdd9bc;
		box-shadow: inset 0 1px #fff7;
	}
	.move-controls :global(.next-move) {
		--next-icon-width: 22px;
		--button-height: 48px;
		--button-min-height: 48px;
		--button-padding: 0 10px;
		--button-gap: 5px;
		--button-font-size: 12px;
		--button-radius: 10px;
	}
	.next-label {
		white-space: nowrap;
	}
	.replay-utilities {
		display: flex;
		align-items: center;
		gap: 10px;
		height: 40px;
		padding: 0 2px;
	}
	.playback-controls {
		display: flex;
		align-items: center;
		gap: 1px;
		padding: 2px;
		border: 1px solid var(--line);
		border-radius: 9px;
		background: var(--paper);
	}
	.playback-controls > :global(.replay-icon) {
		--button-width: 32px;
		--button-height: 32px;
		--button-color: #89957a;
		--button-hover-color: #89957a;
	}
	.playback-controls :global(.autoplay-button) {
		--button-background: var(--paper-deep);
		--button-color: #71845c;
		--button-hover-color: #71845c;
	}
	.replay-counter {
		margin-left: 2px;
		font-size: 10px;
		color: var(--muted);
	}
	.replay-counter > span {
		color: #a6af96;
	}
	.replay-utilities > :global(.flip-button) {
		--button-width: 34px;
		--button-height: 36px;
		margin-left: auto;
	}
	.replay-utilities > :global(.analysis-trigger) {
		--button-height: 36px;
		--button-min-height: 36px;
		--button-padding: 0 11px;
		--button-font-size: 11px;
		--button-gap: 6px;
	}
	:global(:root[data-theme='dark']) .move-chip.current {
		background: #3b4a2f;
		border-color: #546744;
		color: #c0d0a9;
	}
	@media (hover: hover) {
		.move-chip:hover {
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
		.replay-counter {
			display: none;
		}
		.move-chip {
			font-size: 12px;
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
			--button-font-size: 11px;
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
		.replay-counter {
			display: none;
		}
		.replay-utilities > :global(.flip-button) {
			--button-width: 26px;
		}
		.replay-utilities > :global(.analysis-trigger) {
			--button-padding: 0 7px;
			--button-font-size: 10px;
		}
		.move-controls :global(.analysis-trigger) {
			--analysis-icon-width: 13px;
		}
	}
	@media (max-height: 400px) and (min-width: 480px) and (max-width: 620px) {
		.replay-utilities > :global(.analysis-trigger) {
			--analysis-icon-display: none;
		}
		.move-controls :global(.next-move) {
			--button-font-size: 10px;
		}
		.step-controls {
			grid-template-columns: 30px minmax(0, 1fr) 54px;
		}
	}
</style>
