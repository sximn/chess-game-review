<script lang="ts">
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
	let {
		moves,
		ply,
		playing,
		compact,
		onNavigate,
		onPlay,
		onFlip,
		onAnalysis
	}: {
		moves: Move[];
		ply: number;
		playing: boolean;
		compact: boolean;
		onNavigate: (ply: number) => void;
		onPlay: () => void;
		onFlip: () => void;
		onAnalysis: () => void;
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
		<button
			class="previous-move"
			aria-label="Previous move"
			title="Previous move"
			disabled={ply === 0}
			onclick={() => onNavigate(ply - 1)}><ChevronLeft size={24} /></button
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
		<button
			class="replay-action next-move"
			aria-label="Next move"
			disabled={ply === moves.length}
			onclick={() => onNavigate(ply + 1)}
		>
			<span> Next </span>
			<ChevronRight size={22} style="width:var(--next-icon-width)" />
		</button>
	</div>
	<div class="replay-utilities">
		<div class="playback-controls" role="group" aria-label="Automatic playback">
			<button
				class="replay-icon"
				aria-label="First move"
				title="First move"
				disabled={ply === 0}
				onclick={() => onNavigate(0)}><SkipBack size={16} /></button
			>
			<button
				class="replay-icon autoplay-button"
				aria-label={playing ? 'Pause replay' : 'Play replay'}
				title={playing ? 'Pause replay' : 'Play replay'}
				onclick={onPlay}
				>{#if playing}<Pause size={16} />{:else}<Play size={16} />{/if}</button
			>
			<button
				class="replay-icon"
				aria-label="Last move"
				title="Last move"
				disabled={ply === moves.length}
				onclick={() => onNavigate(moves.length)}><SkipForward size={16} /></button
			>
		</div>
		<span class="replay-counter">{ply}<span> / {moves.length}</span></span>
		<button
			class="replay-icon flip-button"
			aria-label="Flip board"
			title="Flip board"
			onclick={onFlip}><ArrowDownUp size={17} /></button
		>
		{#if compact}<button
				class="replay-action analysis-trigger"
				onclick={onAnalysis}
				aria-haspopup="dialog"
				><ChartNoAxesCombined
					size={16}
					style="width:var(--analysis-icon-width);display:var(--analysis-icon-display)"
				/><span>Analysis</span></button
			>{/if}
	</div>
</div>

<style>
	.analysis-trigger {
		--analysis-icon-width: 16px;
		--analysis-icon-display: inline;
	}
	.next-move {
		--next-icon-width: 22px;
	}
	.replay-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		min-height: 43px;
		padding: 0 17px;
		border-radius: 11px;
		font-size: 12px;
		font-weight: 700;
		white-space: nowrap;
		letter-spacing: -0.01em;
		box-shadow:
			inset 0 1px #ffffff85,
			0 2px 3px #42370a0a;
		border: 1px solid var(--line);
		background: var(--paper);
	}
	.next-move {
		color: #353422;
		background: linear-gradient(180deg, var(--yellow-hi), var(--yellow));
		border-color: var(--yellow-lo);
		box-shadow:
			inset 0 1px #ffffffa0,
			inset 0 -1px #0000000c,
			0 2px 3px #42370a1a,
			0 4px 8px -4px #42370a38;
	}
	.analysis-trigger {
		background: linear-gradient(var(--field), var(--paper-deep));
	}
	.replay-icon {
		width: 36px;
		height: 36px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border-radius: 9px;
		color: var(--muted);
	}
	@media (hover: hover) {
		.replay-action:hover {
			transform: translateY(-1px);
			filter: brightness(1.015);
			box-shadow:
				0 3px 9px #42370a17,
				inset 0 1px #fff8;
		}
		.replay-icon:hover {
			background: var(--paper-deep);
			color: #7c8b65;
		}
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
		grid-template-columns: 44px minmax(0, 1fr) 105px;
		gap: 8px;
		padding: 5px;
		border: 1px solid var(--line);
		border-radius: 13px;
		background: var(--paper);
		box-shadow: var(--shadow);
	}
	.previous-move {
		height: 48px;
		padding: 0;
		display: grid;
		place-items: center;
		background: var(--paper-deep);
		color: #7d8d69;
		border: 1px solid var(--line);
		border-radius: 9px;
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
	.move-controls .next-move {
		height: 48px;
		min-height: 48px;
		padding: 0 10px;
		gap: 5px;
		font-size: 12px;
		border-radius: 10px;
	}
	.next-move > span {
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
	.playback-controls > .replay-icon {
		width: 32px;
		height: 32px;
		color: #89957a;
	}
	.playback-controls .autoplay-button {
		background: var(--paper-deep);
		color: #71845c;
	}
	.replay-counter {
		margin-left: 2px;
		font-size: 10px;
		color: var(--muted);
	}
	.replay-counter > span {
		color: #a6af96;
	}
	.replay-utilities > .flip-button {
		width: 34px;
		height: 36px;
		margin-left: auto;
	}
	.replay-utilities > .analysis-trigger {
		height: 36px;
		min-height: 36px;
		padding: 0 11px;
		font-size: 11px;
		gap: 6px;
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
		.previous-move:hover {
			background: var(--surface-green);
		}
	}
	@media (min-width: 1200px) and (min-height: 620px) {
		.analysis-trigger {
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
		.move-controls .next-move {
			padding: 0 4px;
			gap: 1px;
			font-size: 11px;
		}
		.move-controls .next-move {
			--next-icon-width: 18px;
		}
		.previous-move {
			width: 32px;
		}
		.replay-utilities {
			gap: 5px;
			padding: 0;
			flex-wrap: wrap;
			height: auto;
		}
		.playback-controls > .replay-icon {
			width: 26px;
			height: 30px;
		}
		.replay-counter {
			display: none;
		}
		.replay-utilities > .flip-button {
			width: 26px;
		}
		.replay-utilities > .analysis-trigger {
			padding: 0 7px;
			font-size: 10px;
		}
		.analysis-trigger {
			--analysis-icon-width: 13px;
		}
	}
	@media (max-height: 400px) and (min-width: 480px) and (max-width: 620px) {
		.replay-utilities > .analysis-trigger {
			--analysis-icon-display: none;
		}
		.move-controls .next-move {
			font-size: 10px;
		}
		.step-controls {
			grid-template-columns: 30px minmax(0, 1fr) 54px;
		}
	}
	.replay-action:active:not(:disabled) {
		transform: translateY(1px);
	}
</style>
