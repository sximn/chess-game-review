<script lang="ts">
	import Card from './Card.svelte';
	import { Tabs } from 'bits-ui';
	import { demoEvaluations, type Timeline } from '#lib/chess.js';
	import AnalysisTabs from './AnalysisTabs.svelte';
	import AnalysisOverview from './AnalysisOverview.svelte';
	import AnalysisMoves from './AnalysisMoves.svelte';
	import AnalysisCoach from './AnalysisCoach.svelte';
	import EvaluationTimeline from './EvaluationTimeline.svelte';
	import type { AnalysisPresentation } from './analysis.types';
	let {
		timeline,
		demo,
		ply,
		presentation,
		activeTab = $bindable('overview'),
		onNavigate
	}: {
		timeline: Timeline;
		demo: boolean;
		ply: number;
		presentation: AnalysisPresentation;
		activeTab?: string;
		onNavigate: (ply: number) => void;
	} = $props();
</script>

<Tabs.Root bind:value={activeTab}>
	{#snippet child({ props })}
		<Card {...props} class="review-tabs" shadow clip>
			<AnalysisTabs {presentation} />
			<Tabs.Content value="overview">
				{#snippet child({ props })}<AnalysisOverview
						contentProps={props}
						{timeline}
						{demo}
						{presentation}
						{onNavigate}
						onExploreMoves={() => (activeTab = 'moves')}
					/>{/snippet}
			</Tabs.Content>
			<Tabs.Content value="moves">
				{#snippet child({ props })}<AnalysisMoves
						contentProps={props}
						{timeline}
						{demo}
						{ply}
						{presentation}
						{onNavigate}
					/>{/snippet}
			</Tabs.Content>
			<Tabs.Content value="evaluation">
				{#snippet child({ props })}
					<div {...props} class="evaluation-content">
						<EvaluationTimeline
							values={demo ? demoEvaluations : null}
							moves={timeline.moves}
							{ply}
							{presentation}
							{onNavigate}
						/>
					</div>
				{/snippet}
			</Tabs.Content>
		</Card>
	{/snippet}
</Tabs.Root>
{#if activeTab === 'overview'}<AnalysisCoach
		{timeline}
		{demo}
		{ply}
		{presentation}
		{onNavigate}
	/>{/if}

<style>
	.evaluation-content {
		padding: 0;
	}
</style>
