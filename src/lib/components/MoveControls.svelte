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
			class="button primary next-move"
			aria-label="Next move"
			disabled={ply === moves.length}
			onclick={() => onNavigate(ply + 1)}
		>
			<span>
				Next
				<!-- <span class="next-long-label">move</span> -->
			</span>
			<ChevronRight size={22} />
		</button>
	</div>
	<div class="replay-utilities">
		<div class="playback-controls" role="group" aria-label="Automatic playback">
			<button
				class="icon-button"
				aria-label="First move"
				title="First move"
				disabled={ply === 0}
				onclick={() => onNavigate(0)}><SkipBack size={16} /></button
			>
			<button
				class="icon-button autoplay-button"
				aria-label={playing ? 'Pause replay' : 'Play replay'}
				title={playing ? 'Pause replay' : 'Play replay'}
				onclick={onPlay}
				>{#if playing}<Pause size={16} />{:else}<Play size={16} />{/if}</button
			>
			<button
				class="icon-button"
				aria-label="Last move"
				title="Last move"
				disabled={ply === moves.length}
				onclick={() => onNavigate(moves.length)}><SkipForward size={16} /></button
			>
		</div>
		<span class="replay-counter">{ply}<span> / {moves.length}</span></span>
		<button
			class="icon-button flip-button"
			aria-label="Flip board"
			title="Flip board"
			onclick={onFlip}><ArrowDownUp size={17} /></button
		>
		{#if compact}<button
				class="button secondary analysis-trigger"
				onclick={onAnalysis}
				aria-haspopup="dialog"><ChartNoAxesCombined size={16} /><span>Analysis</span></button
			>{/if}
	</div>
</div>
