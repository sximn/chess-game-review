<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import type { AnalysisPresentation } from './analysis.types';

	import { ArrowRight, BookOpen } from 'lucide-svelte';
	import { demoAnalysis, type Timeline } from '#lib/chess.js';
	import AnimatedAccuracy from './AnimatedAccuracy.svelte';
	let {
		contentProps,
		timeline,
		demo,
		presentation,
		onExploreMoves,
		onNavigate
	}: {
		contentProps: HTMLAttributes<HTMLDivElement>;
		timeline: Timeline;
		demo: boolean;
		presentation: AnalysisPresentation;
		onExploreMoves: () => void;
		onNavigate: (ply: number) => void;
	} = $props();
	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');
	let result = $derived(timeline.headers.Result || '*');
</script>

<div {...contentProps} class="overview-content" data-presentation={presentation}>
	{#if demo}
		<div class="recap-intro">
			<span class="analysis-eyebrow">THE BIG PICTURE</span>
			<h2>Beautifully played.</h2>
			<p>Active pieces. A brave sacrifice.<br />A finish worth remembering.</p>
		</div>
		<AnimatedAccuracy whiteName={white} blackName={black} {presentation} />
		<div class="quality-table">
			<div class="quality-table-head">
				<span>MOVE QUALITY</span><span
					><span class="color-dot white-dot"></span><span class="color-dot black-dot"></span></span
				>
			</div>
			{#each demoAnalysis as quality}<button
					class="quality-row"
					onclick={() => {
						onNavigate(quality.plies[0]);
					}}
					><span class="quality-icon" style={`--quality-color:${quality.color}`}
						>{quality.symbol}</span
					><span>{quality.name}</span><b>{quality.white}</b><b>{quality.black}</b></button
				>{/each}
		</div>
		<div class="sample-label"><span></span> Sample review · Illustrative analysis</div>
	{:else}
		<div class="imported-recap">
			<div class="empty-symbol"><BookOpen size={30} /></div>
			<span class="analysis-eyebrow">YOUR GAME, AT YOUR PACE</span>
			<h2>A fresh perspective.</h2>
			<p>
				Your game is ready. Explore all {timeline.moves.length} half-moves, revisit a position, and keep
				your thoughts close.
			</p>
			<div class="import-stats">
				<div><strong>{Math.ceil(timeline.moves.length / 2)}</strong><span>Moves</span></div>
				<div><strong>{result === '*' ? '—' : result}</strong><span>Result</span></div>
			</div>
			<p class="import-notice">
				Engine analysis is not connected yet. Accuracy and move classifications are only available
				in the sample review.
			</p>
			<button class="explore-moves" onclick={onExploreMoves}
				>Explore the moves <ArrowRight size={16} /></button
			>
		</div>
	{/if}
</div>

<style>
	.black-dot {
		background: #5a6250;
		border: 1px solid #5a6250;
	}
	.white-dot {
		background: #f7f3e2;
		border: 1px solid #c7c9b5;
	}
	.color-dot {
		display: inline-block;
		flex-shrink: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}
	.overview-content {
		padding: 25px 24px 13px;
	}
	.recap-intro {
		text-align: center;
	}
	.recap-intro h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		letter-spacing: -0.5px;
		font-size: 28px;
		margin-top: 7px;
	}
	.recap-intro p {
		font-size: 10px;
		line-height: 1.7;
		color: #858c77;
		margin-top: 8px;
	}
	.quality-table {
		padding-top: 15px;
		border-top: 1px solid var(--line);
	}
	.quality-table-head {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
		font-size: 6.8px;
		font-weight: 650;
		letter-spacing: 1.2px;
		color: #a0a48e;
	}
	.quality-table-head > span:last-child {
		display: flex;
		gap: 29px;
		padding-right: 11px;
	}
	.quality-table-head .color-dot {
		width: 6px;
		height: 6px;
	}
	.quality-row {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 9px;
		background: none;
		text-align: left;
		min-height: 33px;
		padding: 0 9px 0 1px;
		border-radius: 6px;
		font-size: 10px;
	}
	.quality-icon {
		width: 20px;
		height: 20px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		font-size: 9px;
		font-weight: 750;
		color: #fff;
		background: linear-gradient(
			160deg,
			color-mix(in srgb, var(--quality-color) 80%, white),
			var(--quality-color)
		);
		box-shadow:
			inset 0 1px #fff5,
			0 1px 2px #0002;
		border: 1px solid color-mix(in srgb, var(--quality-color) 85%, black);
	}
	.quality-row > span:nth-child(2) {
		flex: 1;
		color: #777e68;
	}
	.quality-row > b {
		min-width: 27px;
		text-align: center;
		font-size: 10px;
		font-weight: 600;
		color: #838d70;
	}
	.quality-row > b:last-child {
		color: #b4b8a7;
	}
	.sample-label {
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		font-size: 6.5px;
		color: #8e9780;
		margin: 15px 0 0;
	}
	.sample-label > span {
		width: 3px;
		height: 3px;
		background: #b7bea6;
		border-radius: 50%;
	}
	.imported-recap {
		padding: 0 0 10px;
		text-align: center;
	}
	.empty-symbol {
		color: #92a875;
		background: var(--surface-green);
		border: 1px solid var(--line);
		border-radius: 18px;
		width: 65px;
		height: 65px;
		display: grid;
		place-items: center;
		margin: 5px auto 24px;
	}
	.imported-recap h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-size: 29px;
		font-weight: 400;
		margin: 10px 0;
	}
	.imported-recap > p:not(.import-notice) {
		font-size: 11px;
		line-height: 1.8;
		color: var(--muted);
	}
	.import-stats {
		display: flex;
		justify-content: center;
		gap: 45px;
		margin: 22px 0;
	}
	.import-stats strong {
		font-size: 26px;
		display: block;
		font-weight: 550;
	}
	.import-stats span {
		font-size: 9px;
		color: var(--muted);
		display: block;
		margin-top: 4px;
	}
	.imported-recap .explore-moves {
		margin-top: 20px;
	}
	@media (hover: hover) {
		.quality-row:hover {
			background: var(--bg);
		}
	}
	@media (min-width: 1500px) {
		.overview-content {
			padding: 30px 30px 17px;
		}
		.recap-intro h2 {
			font-size: 32px;
		}
		.recap-intro p {
			font-size: 11px;
		}
		.quality-row {
			min-height: 38px;
			font-size: 11px;
		}
	}
	@media (max-width: 1200px) {
		.overview-content {
			padding: 23px 19px 13px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.overview-content {
			padding: 21px 15px 12px;
		}
		.recap-intro h2 {
			font-size: 25px;
		}
		.recap-intro p {
			font-size: 9px;
		}
		.quality-row {
			font-size: 9px;
			min-height: 31px;
		}
		.quality-icon {
			width: 18px;
			height: 18px;
			font-size: 8px;
		}
	}
	@media (max-width: 760px) {
		.overview-content {
			padding: 25px 28px 17px;
		}
		.recap-intro h2 {
			font-size: 32px;
		}
		.recap-intro p {
			font-size: 11px;
		}
		.quality-table-head {
			font-size: 8px;
			margin-bottom: 13px;
		}
		.quality-table-head > span:last-child {
			gap: 38px;
			padding-right: 13px;
		}
		.quality-row {
			min-height: 39px;
			font-size: 11px;
			gap: 11px;
		}
		.quality-row > b {
			min-width: 34px;
			font-size: 11px;
		}
		.quality-icon {
			width: 24px;
			height: 24px;
			font-size: 11px;
		}
		.sample-label {
			font-size: 8px;
			margin-top: 19px;
		}
		.imported-recap h2 {
			font-size: 31px;
		}
		.imported-recap > p:not(.import-notice) {
			font-size: 12px;
		}
	}
	@media (max-width: 360px) {
		.overview-content {
			padding: 24px 20px 16px;
		}
		.quality-row {
			font-size: 10px;
		}
	}
	:global(:root[data-theme='dark']) .quality-row > span:nth-child(2) {
		color: #b7c0a7;
	}
	:global(:root[data-theme='dark']) .quality-row > b {
		color: #c0cbb0;
	}
	@media (min-width: 1001px) {
		.recap-intro p {
			font-size: 11px;
		}
		.quality-table-head {
			font-size: 8px;
		}
		.quality-row {
			font-size: 12px;
			min-height: 34px;
		}
		.quality-row > b {
			font-size: 12px;
		}
		.quality-icon {
			width: 22px;
			height: 22px;
			font-size: 10px;
		}
		.sample-label {
			font-size: 8px;
		}
		.overview-content {
			padding-top: 21px;
		}
	}
	@media (max-width: 760px) {
		.quality-row {
			min-height: 44px;
		}
	}
	:global(:root[data-theme='dark']) .recap-intro p {
		color: #a4af95;
	}
	.overview-content[data-presentation='sheet'] .sample-label {
		margin-bottom: 4px;
	}
	@media (max-width: 760px) {
		.overview-content[data-presentation='sheet'] {
			padding: 22px 20px 16px;
		}
		.overview-content[data-presentation='sheet'] .quality-row {
			min-height: 42px;
			font-size: 11px;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.overview-content[data-presentation='sheet'] .recap-intro p {
			display: none;
		}
	}
	.explore-moves {
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
		background: linear-gradient(var(--field), var(--paper-deep));
		width: 100%;
	}
	.analysis-eyebrow {
		display: block;
		font-size: 7.5px;
		font-weight: 700;
		color: #959c86;
		letter-spacing: 1.5px;
	}
	.import-notice {
		font-size: 10px;
		line-height: 1.8;
		padding: 12px;
		border-radius: 9px;
		background: var(--bg);
		color: var(--muted);
		margin-top: 20px;
	}
	@media (hover: hover) {
		.explore-moves:hover {
			transform: translateY(-1px);
			filter: brightness(1.015);
			box-shadow:
				0 3px 9px #42370a17,
				inset 0 1px #fff8;
		}
	}
	@media (max-width: 760px) {
		.analysis-eyebrow {
			font-size: 8px;
		}
		.import-notice {
			font-size: 11px;
		}
	}
	@media (min-width: 1001px) {
		.analysis-eyebrow {
			font-size: 9px;
			letter-spacing: 1.2px;
		}
	}
	.explore-moves:active:not(:disabled) {
		transform: translateY(1px);
	}
</style>
