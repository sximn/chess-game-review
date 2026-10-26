<script lang="ts">
	import { Sparkles, BookOpen, ChartNoAxesCombined } from 'lucide-svelte';
	import TabList from './TabList.svelte';
	import type { TabItem } from './tabs.types';
	import type { AnalysisPresentation } from './analysis.types';
	let { presentation }: { presentation: AnalysisPresentation } = $props();
	const tabs: TabItem[] = [
		{ value: 'overview', label: 'Overview', icon: Sparkles },
		{ value: 'moves', label: 'Moves', icon: BookOpen },
		{ value: 'evaluation', label: 'Evaluation', icon: ChartNoAxesCombined }
	];
</script>

<TabList
	items={tabs}
	aria-label="Review panels"
	class="review-tab-list"
	size={presentation === 'sheet' ? 'comfortable' : 'default'}
	style={presentation === 'sidebar'
		? '--tabs-min-width:0;--tabs-trigger-padding:0 5px'
		: '--tabs-active-color:#667d51'}
/>
