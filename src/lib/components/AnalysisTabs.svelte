<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { Sparkles, BookOpen, ChartNoAxesCombined } from 'lucide-svelte';
	import type { AnalysisPresentation } from './analysis.types';
	let { activeTab, presentation }: { activeTab: string; presentation: AnalysisPresentation } =
		$props();
	const tabs = [
		{ value: 'overview', label: 'Overview', icon: Sparkles },
		{ value: 'moves', label: 'Moves', icon: BookOpen },
		{ value: 'evaluation', label: 'Evaluation', icon: ChartNoAxesCombined }
	];
</script>

<Tabs.List aria-label="Review panels">
	{#snippet child({ props })}
		<div
			{...props}
			class="review-tab-list"
			data-presentation={presentation}
			style:--active-tab={['overview', 'moves', 'evaluation'].indexOf(activeTab)}
		>
			<span class="review-tab-indicator" aria-hidden="true"></span>
			{#each tabs as tab (tab.value)}
				<Tabs.Trigger value={tab.value}>
					{#snippet child({ props })}
						<button {...props}
							><tab.icon size={15} style="width: var(--tab-icon-size)" /> {tab.label}</button
						>
					{/snippet}
				</Tabs.Trigger>
			{/each}
		</div>
	{/snippet}
</Tabs.List>

<style>
	/* The strip owns its layout, indicator and both presentation variants. */
	.review-tab-list {
		display: flex;
		position: relative;
		isolation: isolate;
		padding: 6px;
		border-bottom: 1px solid var(--line);
		gap: 3px;
	}
	.review-tab-list > button {
		--tab-icon-size: 13px;
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		min-height: 35px;
		gap: 6px;
		background: none;
		color: #969b88;
		border-radius: 8px;
		font-size: 10px;
		white-space: nowrap;
	}
	.review-tab-list > button[data-state='active'] {
		background: transparent;
		color: #626b50;
		font-weight: 700;
		box-shadow: none;
	}
	.review-tab-indicator {
		position: absolute;
		top: 6px;
		bottom: 6px;
		left: 6px;
		width: calc((100% - 18px) / 3);
		border-radius: 8px;
		background: var(--paper-deep);
		border: 1px solid color-mix(in srgb, var(--sage) 26%, var(--line));
		box-shadow:
			inset 0 1px #ffffff80,
			0 1px 3px #42370a0a;
		transform: translateX(calc(var(--active-tab) * (100% + 3px)));
		transition: transform 0.3s var(--ease);
		pointer-events: none;
		z-index: -1;
	}
	@media (min-width: 1001px) {
		.review-tab-list > button {
			font-size: 11px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.review-tab-list {
			padding: 5px;
			gap: 1px;
		}
		.review-tab-list > button {
			--tab-icon-size: 11px;
			font-size: 8px;
			gap: 4px;
		}
	}
	@media (max-width: 760px) {
		.review-tab-list > button {
			--tab-icon-size: 15px;
			font-size: 11px;
			min-height: 44px;
			gap: 7px;
		}
	}
	.review-tab-list[data-presentation='sidebar'] > button {
		min-width: 0;
		padding: 0 5px;
	}
	.review-tab-list[data-presentation='sheet'] > button {
		min-height: 42px;
		font-size: 11px;
	}
	.review-tab-list[data-presentation='sheet'] > button[data-state='active'] {
		color: #667d51;
	}
	:global(:root[data-theme='dark']) .review-tab-list > button[data-state='active'] {
		color: #c6cdb5;
	}
</style>
