<script lang="ts">
	import { ArrowRight, Lightbulb } from 'lucide-svelte';
	import { demoAnalysis, moveLabel, type Timeline } from '#lib/chess.js';
	import type { AnalysisPresentation } from './analysis.types';
	let {
		timeline,
		demo,
		ply,
		presentation,
		onNavigate
	}: {
		timeline: Timeline;
		demo: boolean;
		ply: number;
		presentation: AnalysisPresentation;
		onNavigate: (ply: number) => void;
	} = $props();
	let classification = $derived(
		demo ? demoAnalysis.find((item) => item.plies.includes(ply)) : undefined
	);
	function nextMoment() {
		onNavigate([19, 25, 29, 31, 33].find((value) => value > ply) ?? 19);
	}
</script>

<div class="coach-card" data-presentation={presentation}>
	<div class="coach-heading">
		<span class="coach-symbol"><Lightbulb size={18} /></span><span>A MOMENT TO REMEMBER</span><span
			class="coach-sparkle">✧</span
		>
	</div>
	<div class="coach-move">
		<strong>{moveLabel(ply, timeline.moves)}</strong>{#if classification}<span
				class="move-classification"
				style={`--quality-color:${classification.color}`}
				>{classification.symbol} {classification.name} move</span
			>{/if}
	</div>
	{#if demo && ply === 19}<p>
			A little courage goes a long way. This knight sacrifice opens the center while Black’s king is
			still looking for safety.
		</p>{:else if demo && ply === 25}<p>
			Give up the rook, keep the initiative. Every white piece joins the attack, and Black has no
			time to catch up.
		</p>{:else if demo && ply === 31}<p>
			The queen steps into danger to clear the last line. One final rook move will bring the whole
			story together.
		</p>{:else if demo && ply === 33}<p>
			A perfect curtain call. The rook and bishop work together to deliver a beautiful checkmate.
		</p>{:else}<p>
			{demo
				? 'Notice how the active pieces work together. Explore the key moments to see how Morphy turns development into an attack.'
				: 'Take a breath and look at the position. Which pieces are active? Where is the king safest? Look for the next useful move.'}
		</p>{/if}{#if demo}<button class="coach-next" onclick={nextMoment}
			>Next key moment <ArrowRight size={16} /></button
		>{/if}
</div>

<style>
	.coach-card {
		background: var(--surface-green);
		border: 1px solid #dde4cf;
		border-radius: 13px;
		margin-top: 16px;
		padding: 17px 19px 0;
		overflow: hidden;
	}
	.coach-heading {
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.coach-heading > span:nth-child(2) {
		font-size: 7px;
		font-weight: 700;
		letter-spacing: 1px;
		color: #8d9a79;
	}
	.coach-sparkle {
		margin-left: auto;
		font-size: 22px;
		color: #a6b68e;
	}
	.coach-move {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 15px;
		flex-wrap: wrap;
	}
	.coach-move > strong {
		font-size: 16px;
		letter-spacing: -0.4px;
	}
	.move-classification {
		font-size: 8px;
		font-weight: 650;
		color: var(--quality-color);
		background: color-mix(in srgb, var(--quality-color) 9%, var(--paper));
		border: 1px solid color-mix(in srgb, var(--quality-color) 22%, var(--paper));
		padding: 4px 7px;
		border-radius: 5px;
	}
	.coach-card > p {
		font-size: 10px;
		line-height: 1.8;
		color: #768465;
		margin: 9px 0 16px;
		max-width: 310px;
	}
	.coach-next {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: calc(100% + 38px);
		margin-left: -19px;
		background: #e3e9d8;
		border-top: 1px solid #d9e1cb;
		padding: 12px 19px;
		font-size: 9px;
		font-weight: 650;
		color: #7a8c64;
	}
	@media (hover: hover) {
		.coach-next:hover {
			background: #dce5cf;
		}
	}
	@media (min-width: 1500px) {
		.coach-card > p {
			font-size: 11px;
		}
		.coach-card {
			padding: 20px 22px 0;
		}
		.coach-next {
			margin-left: -22px;
			width: calc(100% + 44px);
			padding: 14px 22px;
		}
		.coach-heading > span:nth-child(2) {
			font-size: 8px;
		}
	}
	@media (max-width: 1200px) {
		.coach-card {
			padding-left: 16px;
			padding-right: 16px;
		}
		.coach-next {
			margin-left: -16px;
			width: calc(100% + 32px);
			padding-left: 16px;
			padding-right: 16px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.coach-card {
			padding: 13px 13px 0;
			margin-top: 12px;
		}
		.coach-heading > span:nth-child(2) {
			font-size: 6px;
			letter-spacing: 0.7px;
		}
		.coach-card > p {
			font-size: 9px;
		}
		.coach-next {
			width: calc(100% + 26px);
			margin-left: -13px;
			padding: 10px 13px;
			font-size: 8px;
		}
		.coach-move > strong {
			font-size: 14px;
		}
		.move-classification {
			font-size: 7px;
		}
	}
	@media (max-width: 760px) {
		.coach-card {
			margin-top: 17px;
			padding: 20px 21px 0;
		}
		.coach-heading > span:nth-child(2) {
			font-size: 8px;
		}
		.coach-move {
			margin-top: 18px;
		}
		.coach-move > strong {
			font-size: 19px;
		}
		.move-classification {
			font-size: 9px;
		}
		.coach-card > p {
			font-size: 12px;
			max-width: none;
			line-height: 1.9;
			margin: 12px 0 20px;
		}
		.coach-next {
			width: calc(100% + 42px);
			margin-left: -21px;
			padding: 14px 21px;
			font-size: 11px;
		}
	}
	@media (max-width: 360px) {
		.coach-heading > span:nth-child(2) {
			font-size: 7px;
		}
	}
	:global(:root[data-theme='dark']) .coach-card {
		border-color: #445238;
	}
	:global(:root[data-theme='dark']) .coach-next {
		background: #39472e;
		border-color: #445238;
		color: #acbc94;
	}
	:global(:root[data-theme='dark']) .coach-card > p {
		color: #b1bea0;
	}
	@media (min-width: 1001px) {
		.coach-heading > span:nth-child(2) {
			font-size: 8px;
			letter-spacing: 0.7px;
		}
		.coach-card > p {
			font-size: 12px;
			max-width: none;
			line-height: 1.8;
		}
		.coach-next {
			font-size: 11px;
		}
		.coach-move > strong {
			font-size: 18px;
		}
		.move-classification {
			font-size: 9px;
		}
		.coach-card {
			padding-top: 15px;
		}
		.coach-move {
			margin-top: 12px;
		}
	}
	.coach-card[data-presentation='sheet'] {
		margin-top: 14px;
	}
	.coach-card[data-presentation='sheet'] > p {
		font-size: 12px;
		max-width: none;
	}
	.coach-symbol {
		width: 27px;
		height: 27px;
		background: #e0e8d1;
		border: 1px solid #d1ddbf;
		border-radius: 8px;
		color: #7f9363;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}
	:global(:root[data-theme='dark']) .coach-symbol {
		background: #3b4b30;
		border-color: #526443;
		color: #adbf96;
	}
</style>
