<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { AnalysisPresentation } from './analysis.types';

	import type { Move } from 'chess.js';
	import { demoAnalysis, moveLabel, type Timeline } from '#lib/chess.js';
	let {
		contentProps,
		timeline,
		demo,
		ply,
		presentation,
		onNavigate
	}: {
		contentProps: HTMLAttributes<HTMLDivElement>;
		timeline: Timeline;
		demo: boolean;
		ply: number;
		presentation: AnalysisPresentation;
		onNavigate: (ply: number) => void;
	} = $props();
	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');
	let movePairs = $derived.by(() => {
		const pairs = new Map<
			number,
			{ number: number; white?: Move; black?: Move; whitePly: number; blackPly: number }
		>();
		timeline.moves.forEach((move, index) => {
			const number = Number(move.before.split(' ')[5]);
			const pair = pairs.get(number) ?? { number, whitePly: 0, blackPly: 0 };
			if (move.color === 'w') {
				pair.white = move;
				pair.whitePly = index + 1;
			} else {
				pair.black = move;
				pair.blackPly = index + 1;
			}
			pairs.set(number, pair);
		});
		return [...pairs.values()];
	});
</script>

<div {...contentProps} class="moves-content" data-presentation={presentation}>
	<div class="move-list-heading">
		<span>THE STORY, MOVE BY MOVE</span><span>{timeline.moves.length} half-moves</span>
	</div>
	<div class="moves-list">
		<div class="move-column-head"><span>#</span><span>{white}</span><span>{black}</span></div>
		{#each movePairs as pair}<div class="move-pair">
				<span>{pair.number}.</span
				>{#each [pair.white, pair.black] as move, colorIndex}{@const movePly =
						colorIndex === 0 ? pair.whitePly : pair.blackPly}{@const quality = demo
						? demoAnalysis.find((q) => q.plies.includes(movePly))
						: null}{#if move}<button
							class:current={ply === movePly}
							aria-label={`Go to ${moveLabel(movePly, timeline.moves)}`}
							aria-current={ply === movePly ? 'step' : undefined}
							onclick={() => onNavigate(movePly)}
							>{move.san}{#if quality}<span style={`color:${quality.color}`}>{quality.symbol}</span
								>{/if}</button
						>{:else}<span></span>{/if}{/each}
			</div>{/each}
	</div>
</div>

<style>
	.moves-content {
		padding: 15px 15px 0;
	}
	.move-list-heading {
		display: flex;
		justify-content: space-between;
		font-size: 6.5px;
		letter-spacing: 0.7px;
		color: #a0a88f;
		padding: 5px 1px 13px;
		border-bottom: 1px solid var(--line);
	}
	.move-list-heading > span:last-child {
		letter-spacing: 0;
	}
	.moves-list {
		overflow-y: auto;
		scrollbar-width: thin;
		scrollbar-color: #b1b99f var(--paper);
		max-height: none;
	}
	.move-pair {
		display: grid;
		grid-template-columns: 29px 1fr 1fr;
		gap: 4px;
		align-items: center;
	}
	.move-column-head {
		display: grid;
		grid-template-columns: 29px 1fr 1fr;
		gap: 4px;
		align-items: center;
	}
	.move-column-head {
		font-size: 7px;
		color: var(--muted);
		padding: 14px 0 10px;
	}
	.move-column-head > span {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.move-pair {
		border-radius: 5px;
		padding: 2px 0;
	}
	.move-pair:nth-child(2n) {
		background: var(--bg);
	}
	.move-pair > span {
		font-size: 8px;
		color: #adb49f;
		text-align: center;
	}
	.move-pair > button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 31px;
		padding: 0 9px;
		border-radius: 5px;
		background: none;
		text-align: left;
		font-size: 11px;
		font-weight: 600;
	}
	.move-pair > button > span {
		font-size: 8px;
	}
	.move-pair > button.current {
		background: #ece8ff;
		color: var(--violet);
		box-shadow: inset 0 0 0 1px #d8d0fc;
	}
	@media (hover: hover) {
		.move-pair > button:hover {
			background: var(--paper-deep);
		}
	}
	@media (max-width: 760px) {
		.moves-content {
			padding: 18px 20px 0;
		}
		.move-list-heading {
			font-size: 8px;
		}
		.move-column-head {
			font-size: 8px;
		}
		.move-pair > button {
			font-size: 13px;
			min-height: 36px;
		}
		.move-pair > button > span {
			font-size: 10px;
		}
		.move-pair > span {
			font-size: 10px;
		}
	}
	:global(:root[data-theme='dark']) .move-pair > button.current {
		background: #45405b;
		box-shadow: inset 0 0 0 1px #7062ee66;
		color: #c2b8ff;
	}
	@media (min-width: 1001px) {
		.move-pair > button {
			font-size: 13px;
		}
		.move-pair > span {
			font-size: 10px;
		}
	}
	.moves-content[data-presentation='sheet'] .move-pair > button {
		min-height: 42px;
	}
</style>
