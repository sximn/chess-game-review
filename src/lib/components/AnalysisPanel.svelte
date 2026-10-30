<script lang="ts">
	import { Tabs } from 'bits-ui';
	import Card from './Card.svelte';
	import AnalysisTabs from './AnalysisTabs.svelte';
	import AnalysisMoves from './AnalysisMoves.svelte';
	import EvaluationTimeline from './EvaluationTimeline.svelte';
	import type { Timeline } from '#lib/chess.js';
	import type { AnalysisPresentation } from './analysis.types';
	import type { ReviewState } from '#lib/engine/review.js';
	import { formatScore, visualValue } from '#lib/engine/classification.js';
	import { continuation } from '#lib/engine/presentation.js';

	let {
		timeline,
		review,
		ply,
		presentation,
		activeTab = $bindable('overview'),
		onNavigate,
		onExplore,
		onPause,
		onResume,
		onRetry
	}: {
		timeline: Timeline;
		review: ReviewState;
		ply: number;
		presentation: AnalysisPresentation;
		activeTab?: string;
		onNavigate: (ply: number) => void;
		onExplore: (ply: number, pv: string[]) => void;
		onPause: () => void;
		onResume: () => void;
		onRetry: () => void;
	} = $props();

	let result = $derived(
		review.alternatives[ply] ??
			review.positions[ply] ??
			(review.selectedPly === ply ? review.selectedLive : undefined)
	);
	let quality = $derived(review.qualities[ply]);
	let summary = $derived(
		['Best', 'Good', 'Inaccuracy', 'Mistake', 'Blunder', 'Uncertain'].map((name) => ({
			name,
			white: review.qualities.filter(
				(q, i) => q?.name === name && timeline.moves[i - 1]?.color === 'w'
			).length,
			black: review.qualities.filter(
				(q, i) => q?.name === name && timeline.moves[i - 1]?.color === 'b'
			).length,
			ply: review.qualities.findIndex((q) => q?.name === name)
		}))
	);
	let values = $derived(timeline.fens.map((_, i) => visualValue(review.positions[i])));
	const outcomes: Record<string, string> = {
		checkmate: 'Checkmate',
		stalemate: 'Draw by stalemate',
		repetition: 'Draw by threefold repetition',
		'fifty-move': 'Draw by the fifty-move rule',
		'insufficient-material': 'Draw by insufficient material'
	};
</script>

<div class="engine-status" aria-live="polite">
	<div>
		<strong
			>{review.phase === 'complete'
				? 'Review ready'
				: review.phase === 'loading'
					? 'Preparing Frozenight'
					: review.phase === 'refining'
						? 'Refining key moments'
						: review.phase === 'paused'
							? 'Review paused'
							: review.phase === 'error'
								? 'Analysis unavailable'
								: 'Reviewing on this device'}</strong
		><span>{review.scored} / {review.total} positions</span>
	</div>
	<progress max={review.total || 1} value={review.scored} aria-label="Game review progress"
	></progress>
	{#if review.error}<p role="alert">{review.error.message} <small>({review.error.code})</small></p>
		<button class="review-action" onclick={onRetry}>Retry analysis</button>
	{:else if review.phase === 'paused'}<button class="review-action" onclick={onResume}
			>Resume review</button
		>
	{:else if review.phase !== 'complete'}<button class="review-action" onclick={onPause}
			>Pause review</button
		>{/if}
	{#if review.warning}<p>{review.warning}</p>{/if}
</div>
<Tabs.Root bind:value={activeTab}>
	{#snippet child({ props })}
		<Card {...props} class="review-tabs" shadow clip>
			<AnalysisTabs {presentation} />
			<Tabs.Content value="overview">
				<div class="engine-overview">
					<p class="review-caption">Frozenight · local analysis · preliminary estimates</p>
					<div class="quality-head">
						<span>Move quality</span><span>White</span><span>Black</span>
					</div>
					{#each summary as item}<button
							class="quality-row"
							disabled={item.ply < 1}
							onclick={() => onNavigate(item.ply)}
							><span>{item.name}</span><b>{item.white}</b><b>{item.black}</b></button
						>{/each}
					<p class="review-caption">
						Labels compare the best and played moves from the same position. Near-threshold and
						large changes receive a deeper comparison.
					</p>
					{#if quality}<div class="played-quality">
							<strong style:color={quality.color}>{quality.symbol} {quality.name}</strong><span
								>{quality.preliminary ? 'Preliminary' : 'Refined'} · depths {quality.comparedDepths
									.map((depth) => depth ?? '—')
									.join(' / ')}</span
							>{#if quality.lossCp !== null}<span>{quality.lossCp} cp measured loss</span
								>{/if}{#if quality.noise}<span
									>These moves were too close to distinguish reliably.</span
								>{/if}
						</div>
						{#if quality.alternative.length && quality.name !== 'Best'}<button
								class="review-action"
								onclick={() => onExplore(quality.rootPly, quality.alternative)}
								>Explore the alternative before this move</button
							>{/if}
					{/if}
				</div>
			</Tabs.Content>
			<Tabs.Content value="moves"
				>{#snippet child({ props })}<AnalysisMoves
						contentProps={props}
						{timeline}
						qualities={review.qualities}
						{ply}
						{presentation}
						{onNavigate}
					/>{/snippet}</Tabs.Content
			>
			<Tabs.Content value="evaluation"
				><EvaluationTimeline
					{presentation}
					{values}
					qualities={review.qualities}
					moves={timeline.moves}
					{ply}
					{onNavigate}
				/></Tabs.Content
			>
		</Card>
	{/snippet}
</Tabs.Root>
<section class="engine-lines" aria-label="Engine alternatives">
	<div class="lines-heading">
		<strong>{result?.outcome ? outcomes[result.outcome] : 'Best continuations'}</strong><b
			>{formatScore(result?.terminalScore ?? result?.lines[0]?.score, result?.winner)}</b
		>
	</div>
	<p class="review-caption">
		White’s perspective{#if result}
			· depth {result.depth ?? '—'} · {result.nodes?.toLocaleString() ?? '—'} nodes{/if}
	</p>
	{#if result?.lines.length}
		{#each result.lines as line}
			<button
				class="engine-line"
				onclick={() => onExplore(ply, line.pv)}
				aria-label={`Explore alternative ${line.rank}`}
				><b>{line.rank}. {formatScore(line.score)}</b><span
					>{continuation(timeline.fens[ply], line.pv).sans.join(' ')}</span
				></button
			>
		{/each}
		{#if result.reason === 'time' || result.reason === 'nodes'}<p class="review-caption">
				Budget reached. Showing the last completed iteration.
			</p>{/if}
	{:else if !result?.outcome}<p class="review-caption">
			{review.phase === 'paused'
				? 'Resume review to analyze this position.'
				: 'Waiting for a completed search iteration…'}
		</p>{/if}
</section>

<style>
	.engine-status,
	.engine-lines {
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 13px;
		padding: 15px;
		margin-bottom: 12px;
		font-size: 12px;
	}
	.engine-status > div,
	.lines-heading {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: center;
	}
	.engine-status strong {
		font-size: 12px;
	}
	.engine-status span {
		font-size: 10px;
		color: var(--muted);
		white-space: nowrap;
	}
	progress {
		display: block;
		width: 100%;
		height: 5px;
		margin: 10px 0;
		accent-color: var(--sage);
	}
	.engine-status p {
		line-height: 1.6;
		margin: 10px 0;
	}
	.review-action {
		background: var(--surface-green);
		border: 1px solid var(--line);
		padding: 9px 12px;
		min-height: 36px;
		border-radius: 8px;
		text-align: left;
		font-size: 11px;
	}
	.engine-overview {
		padding: 16px 20px;
	}
	.review-caption {
		font-size: 10px;
		line-height: 1.7;
		color: var(--muted);
		margin: 8px 0 12px;
	}
	.quality-head,
	.quality-row {
		display: grid;
		grid-template-columns: 1fr 40px 40px;
		gap: 10px;
		width: 100%;
		align-items: center;
	}
	.quality-head {
		font-size: 9px;
		color: var(--muted);
		margin: 16px 0 6px;
	}
	.quality-row {
		background: none;
		text-align: left;
		min-height: 36px;
		font-size: 12px;
		border-radius: 6px;
		padding: 5px;
	}
	.quality-row b {
		text-align: center;
	}
	.quality-head span:not(:first-child) {
		text-align: center;
	}
	.quality-row:disabled {
		opacity: 0.6;
	}
	.quality-row:hover:not(:disabled) {
		background: var(--bg);
	}
	.played-quality {
		border-top: 1px solid var(--line);
		padding-top: 12px;
		margin-top: 12px;
		display: grid;
		gap: 6px;
	}
	.played-quality span {
		font-size: 10px;
		color: var(--muted);
	}
	.engine-lines {
		margin-top: 12px;
		margin-bottom: 0;
	}
	.lines-heading {
		font-size: 12px;
	}
	.engine-line {
		display: flex;
		gap: 12px;
		align-items: start;
		width: 100%;
		text-align: left;
		min-height: 44px;
		border-radius: 8px;
		padding: 10px;
		background: var(--bg);
		margin: 6px 0;
		font-size: 11px;
		line-height: 1.6;
	}
	.engine-line b {
		white-space: nowrap;
		min-width: 60px;
	}
	.engine-line span {
		overflow-wrap: anywhere;
	}
	.engine-line:hover {
		background: var(--paper-deep);
	}
</style>
