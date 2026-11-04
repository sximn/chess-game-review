<script lang="ts">
	import { qualityTextColor } from './quality-colors';
	import { getColorByQuality } from '#lib/engine/classification.js';
	import { Tabs } from 'bits-ui';
	import Card from '#lib/components/ui/Card.svelte';
	import AnalysisTabs from './AnalysisTabs.svelte';
	import AnalysisMoves from './AnalysisMoves.svelte';
	import EvaluationTimeline from './EvaluationTimeline.svelte';
	import type { Timeline } from '#lib/chess.js';
	import type { AnalysisPresentation } from './analysis.types';
	import type { ReviewState } from '#lib/engine/review.js';
	import { formatScore, visualValue, MOVE_QUALITIES } from '#lib/engine/classification.js';
	import { continuation } from '#lib/engine/presentation.js';

	let {
		timeline,
		review,
		ply,
		presentation,
		analysisDetail = false,
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
		analysisDetail?: boolean;
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
		MOVE_QUALITIES.map((name) => ({
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
	let ratedMoves = $derived(summary.reduce((total, item) => total + item.white + item.black, 0));
	let distributionLabel = $derived(
		ratedMoves
			? summary
					.filter((item) => item.white + item.black > 0)
					.map((item) => `${item.name}: ${item.white + item.black} of ${ratedMoves} moves`)
					.join(', ')
			: 'No moves rated yet'
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

<Tabs.Root bind:value={activeTab}>
	{#snippet child({ props })}
		<Card {...props} class="review-tabs" shadow clip>
			<AnalysisTabs {presentation} />
			<Tabs.Content value="overview">
				<div class="engine-overview">
					<div class="engine-status" aria-live="polite">
						<div class="review-status-heading">
							<strong>
								{review.phase === 'complete'
									? 'Review ready'
									: review.phase === 'loading'
										? 'Preparing Frozenight'
										: review.phase === 'refining'
											? analysisDetail
												? 'Refining key moments'
												: 'Reviewing key moments'
											: review.phase === 'paused'
												? 'Review paused'
												: review.phase === 'error'
													? 'Analysis unavailable'
													: 'Reviewing on this device'}
							</strong>
							<span>{review.scored} / {review.total} positions</span>
						</div>

						<div
							class="quality-distribution"
							role="img"
							aria-label={`Move quality distribution. ${distributionLabel}`}
						>
							{#each summary as item (item.name)}
								{@const count = item.white + item.black}
								{#if count > 0}
									<span
										class="quality-segment"
										class:uncertain={item.name === 'Uncertain'}
										style:flex-grow={count}
										style:background-color={item.name === 'Best'
											? 'var(--quality-best-fill)'
											: getColorByQuality(item.name)}
										title={`${item.name}: ${count} (${Math.round((count / ratedMoves) * 100)}%)`}
									></span>
								{/if}
							{/each}
						</div>

						{#if review.error}
							<p role="alert">{review.error.message} <small>({review.error.code})</small></p>
							<button class="review-action" onclick={onRetry}>Retry analysis</button>
						{:else if review.phase === 'paused'}
							<button class="review-action" onclick={onResume}> Resume review </button>
						{:else if review.phase !== 'complete'}
							<button class="review-action" onclick={onPause}> Pause review </button>
						{/if}

						{#if review.warning}<p>{review.warning}</p>{/if}
					</div>

					<div class="quality-head">
						<span>Move quality</span><span>White</span><span>Black</span>
					</div>

					{#each summary as item}
						<button
							class="quality-row"
							disabled={item.ply < 1}
							onclick={() => onNavigate(item.ply)}
						>
							<span class="quality-label"
								><i
									aria-hidden="true"
									style:background-color={item.name === 'Best'
										? 'var(--quality-best-fill)'
										: getColorByQuality(item.name)}
								></i>{item.name}</span
							>
							<b>{item.white}</b>
							<b>{item.black}</b>
						</button>
					{/each}

					{#if analysisDetail}<p class="review-caption analysis-detail">
							Labels compare estimated expected points for the best and played moves. PGN player
							ratings are used when available; otherwise 1200. Key moments receive a deeper
							comparison.
						</p>{/if}

					{#if quality}
						<div class="played-quality">
							<strong style:color={qualityTextColor(quality.name)}
								>{quality.symbol} {quality.name}</strong
							>
							{#if analysisDetail}<span class="analysis-detail">
									{quality.preliminary ? 'Preliminary' : 'Refined'} · depths {quality.comparedDepths
										.map((depth) => depth ?? '—')
										.join(' / ')}
								</span>

								{#if quality.lossExpectedPoints !== null}
									<span
										>{(quality.lossExpectedPoints * 100).toFixed(1)}% expected points lost · rating {quality.rating}</span
									>
								{/if}

								{#if quality.lossCp !== null}
									<span>{quality.lossCp} cp measured loss</span>
								{/if}

								{#if quality.noise}
									<span>These moves were too close to distinguish reliably.</span>
								{/if}
							{/if}
						</div>

						{#if quality.alternative.length && quality.name !== 'Best'}
							<button
								class="review-action"
								onclick={() => onExplore(quality.rootPly, quality.alternative)}
							>
								Explore the alternative before this move
							</button>
						{/if}
					{/if}
				</div>
			</Tabs.Content>
			<Tabs.Content value="moves">
				{#snippet child({ props })}
					<AnalysisMoves
						contentProps={props}
						{timeline}
						qualities={review.qualities}
						{ply}
						{presentation}
						{analysisDetail}
						{onNavigate}
					/>
				{/snippet}
			</Tabs.Content>
			<Tabs.Content value="evaluation">
				<EvaluationTimeline
					{presentation}
					{values}
					qualities={review.qualities}
					moves={timeline.moves}
					{ply}
					{onNavigate}
				/>
			</Tabs.Content>
		</Card>
	{/snippet}
</Tabs.Root>

<section class="engine-lines" aria-label="Engine alternatives">
	<div class="lines-heading">
		<strong>{result?.outcome ? outcomes[result.outcome] : 'Best continuations'}</strong>
		<b>{formatScore(result?.terminalScore ?? result?.lines[0]?.score, result?.winner)}</b>
	</div>
	<p class="review-caption">
		White’s perspective{#if analysisDetail && result}
			· depth {result.depth ?? '—'} · {result.nodes?.toLocaleString() ?? '—'} nodes{/if}
	</p>
	{#if result?.lines.length}
		{#each result.lines as line}
			<button
				class="engine-line"
				onclick={() => onExplore(ply, line.pv)}
				aria-label={`Explore alternative ${line.rank}`}
			>
				<b>{line.rank}. {formatScore(line.score)}</b>
				<span>{continuation(timeline.fens[ply], line.pv).sans.join(' ')}</span>
			</button>
		{/each}
		{#if analysisDetail && (result.reason === 'time' || result.reason === 'nodes')}
			<p class="review-caption">Budget reached. Showing the last completed iteration.</p>
		{/if}
	{:else if !result?.outcome}
		<p class="review-caption">
			{review.phase === 'paused'
				? 'Resume review to analyze this position.'
				: 'Waiting for a completed search iteration…'}
		</p>
	{/if}
</section>

<style>
	.engine-lines {
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		padding: 15px;
		margin-bottom: 12px;
		font-size: var(--text-sm);
	}
	.review-status-heading,
	.lines-heading {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		align-items: center;
	}
	.review-status-heading {
		flex-wrap: wrap;
		gap: 6px 10px;
	}
	.engine-status .review-action {
		margin-top: 12px;
	}
	.engine-status strong {
		font-size: var(--text-sm);
	}
	.engine-status span {
		font-size: var(--text-caption);
		color: var(--muted);
		white-space: nowrap;
	}
	.engine-status {
		margin-bottom: 20px;
	}
	.quality-distribution {
		display: flex;
		width: 100%;
		height: 12px;
		margin-top: 12px;
		border-radius: var(--radius-pill);
		overflow: hidden;
		background: var(--surface-subtle);
	}
	.quality-distribution .quality-segment {
		flex-basis: 0;
		min-width: 0;
		transition: flex-grow 350ms ease;
	}
	.quality-segment.uncertain {
		box-shadow: inset 2px 0 var(--paper);
		background-image: repeating-linear-gradient(135deg, transparent 0 3px, #ffffff30 3px 5px);
	}
	@media (prefers-reduced-motion: reduce) {
		.quality-distribution .quality-segment {
			transition: none;
		}
	}
	.engine-status p {
		line-height: var(--leading-body);
		margin: 10px 0;
	}
	.review-action {
		background: var(--surface-subtle);
		border: 1px solid var(--line);
		padding: 9px 12px;
		min-height: 36px;
		border-radius: var(--radius-sm);
		text-align: left;
		font-size: var(--text-sm);
	}
	.engine-overview {
		--quality-best-fill: #426b35;
		padding: 16px 20px;
	}
	.review-caption {
		font-size: var(--text-caption);
		line-height: var(--leading-relaxed);
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
		font-size: var(--text-caption);
		color: var(--muted);
		margin: 16px 0 6px;
	}
	.quality-row {
		background: none;
		text-align: left;
		min-height: 36px;
		font-size: var(--text-sm);
		border-radius: var(--radius-xs);
		padding: 5px;
	}
	.quality-label {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.quality-label i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
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
	.engine-lines {
		margin-top: 12px;
		margin-bottom: 0;
	}
	.lines-heading {
		font-size: var(--text-sm);
	}
	.engine-line {
		display: flex;
		gap: 12px;
		align-items: start;
		width: 100%;
		text-align: left;
		min-height: 44px;
		border-radius: var(--radius-sm);
		padding: 10px;
		background: var(--bg);
		margin: 6px 0;
		font-size: var(--text-sm);
		line-height: var(--leading-body);
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
