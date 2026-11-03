<script lang="ts">
	import { tick } from 'svelte';
	import { GitBranch } from 'lucide-svelte';
	import type { Move } from 'chess.js';
	import { moveLabel } from '#lib/chess.js';

	let {
		moves,
		ply,
		alternative,
		onNavigate
	}: {
		moves: Move[];
		ply?: number;
		alternative: boolean;
		onNavigate: (ply: number) => void;
	} = $props();
	let steps = $state<HTMLDivElement>();
	$effect(() => {
		ply;
		moves;
		let cancelled = false;
		void tick().then(() => {
			if (cancelled || !steps) return;
			const selected = steps.querySelector<HTMLElement>('[aria-current="step"]');
			if (selected)
				steps.scrollTo({
					left: selected.offsetLeft - (steps.clientWidth - selected.offsetWidth) / 2,
					behavior: 'instant'
				});
			else steps.scrollLeft = 0;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<div class="variation-line" class:active={ply !== undefined}>
	<div class="line-heading">
		<span><GitBranch size={12} /> {alternative ? 'Alternative line' : 'Best line'}</span>
	</div>
	<div
		class="variation-steps"
		bind:this={steps}
		role="group"
		aria-label="Alternative move timeline"
	>
		<button
			class="variation-step"
			aria-label="Alternative starting position"
			aria-current={ply === 0 ? 'step' : undefined}
			onclick={() => onNavigate(0)}>Start</button
		>
		{#each moves as move, index}
			<button
				class="variation-step"
				aria-label={`Explore ${moveLabel(index + 1, moves)}`}
				aria-current={ply === index + 1 ? 'step' : undefined}
				onclick={() => onNavigate(index + 1)}
			>
				<span>{move.before.split(' ')[5]}{move.color === 'w' ? '.' : '…'}</span>{move.san}
			</button>
		{/each}
	</div>
</div>

<style>
	.variation-line {
		border-left: 2px solid var(--sage);
		padding: 0 0 0 10px;
		min-width: 0;
	}
	.variation-line.active {
		border-color: var(--selection-border);
	}
	.line-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 3px;
		font-size: var(--text-caption);
		color: var(--muted);
	}
	.line-heading > span:first-child {
		display: flex;
		align-items: center;
		gap: 5px;
		font-weight: var(--weight-semibold);
	}
	.active .line-heading > span:first-child {
		color: var(--text-accent);
	}
	.variation-steps {
		position: relative;
		display: flex;
		align-items: center;
		gap: 4px;
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: var(--line) transparent;
		overscroll-behavior-x: contain;
		padding-bottom: 3px;
	}
	.variation-step {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		min-height: 36px;
		padding: 0 9px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--paper);
		color: var(--ink);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}
	.variation-step > span {
		font-size: var(--text-caption);
		color: var(--muted);
		font-weight: var(--weight-regular);
	}
	.variation-step[aria-current='step'] {
		background: var(--selection-bg);
		border-color: var(--selection-border);
		color: var(--selection-text);
	}
	.variation-step[aria-current='step'] > span {
		color: inherit;
	}
	@media (hover: hover) {
		.variation-step:hover:not([aria-current='step']) {
			background: var(--surface-green);
		}
	}
</style>
