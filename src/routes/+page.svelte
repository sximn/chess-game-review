<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import GameReplay from '#lib/components/GameReplay.svelte';
	import AnalysisPanel from '#lib/components/AnalysisPanel.svelte';
	import AnalysisSheet from '#lib/components/AnalysisSheet.svelte';
	import { app, notify } from '#lib/state.svelte.js';
	import { demoAnalysis, demoEvaluations, parseGame } from '#lib/chess.js';

	let game = $derived(
		app.games.find((g) => g.id === (page.url.searchParams.get('game') || app.currentId)) ??
			app.games[0]
	);
	let timeline = $derived(parseGame(game.pgn));
	let demo = $derived(game.id === 'opera');
	let ply = $state(19);
	let flipped = $state(false);
	let playing = $state(false);
	let compact = $state(true);
	let activeTab = $state('overview');
	let previousId = '';
	let classification = $derived(
		demo ? demoAnalysis.find((item) => item.plies.includes(ply)) : undefined
	);
	let evaluation = $derived(demo ? demoEvaluations[ply] : null);
	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');

	onMount(() => {
		const wide = matchMedia('(min-width: 1200px) and (min-height: 620px)');
		const update = () => {
			compact = !wide.matches;
			if (wide.matches) app.analysisOpen = false;
		};
		update();
		wide.addEventListener('change', update);
		return () => wide.removeEventListener('change', update);
	});
	onDestroy(() => {
		app.analysisOpen = false;
	});
	$effect(() => {
		if (game.id !== previousId) {
			previousId = game.id;
			activeTab = 'overview';
			ply = demo ? 19 : 0;
			playing = false;
			app.analysisOpen = false;
		}
	});
	$effect(() => {
		if (!playing) return;
		const interval = setInterval(() => {
			if (ply < timeline.moves.length) ply++;
			else playing = false;
		}, 1200);
		return () => clearInterval(interval);
	});
	function go(value: number) {
		playing = false;
		ply = Math.max(0, Math.min(timeline.moves.length, value));
	}
	function goFromAnalysis(value: number) {
		go(value);
		if (compact) app.analysisOpen = false;
	}
	function togglePlayback() {
		if (ply === timeline.moves.length) ply = 0;
		playing = !playing;
	}
	function openAnalysis() {
		playing = false;
		app.analysisOpen = true;
	}
	function onKey(event: KeyboardEvent) {
		if (app.importOpen || app.helpOpen || app.analysisOpen || app.menuOpen) return;
		const target = event.target;
		if (
			target instanceof HTMLElement &&
			(['INPUT', 'TEXTAREA'].includes(target.tagName) ||
				target.isContentEditable ||
				target.closest('[role="tablist"],[role="menu"]'))
		)
			return;
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			go(ply - 1);
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			go(ply + 1);
		}
		if (event.key === ' ' && target === document.body) {
			event.preventDefault();
			togglePlayback();
		}
		if (event.key === 'Home') {
			event.preventDefault();
			go(0);
		}
		if (event.key === 'End') {
			event.preventDefault();
			go(timeline.moves.length);
		}
	}

	function download() {
		try {
			const url = URL.createObjectURL(new Blob([game.pgn], { type: 'application/x-chess-pgn' }));
			const a = document.createElement('a');
			a.href = url;
			a.download = `${white}-vs-${black}.pgn`;
			a.click();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch {
			notify('The PGN could not be exported. Please try again.');
		}
	}
</script>

<svelte:head><title>Game review · Up a Pawn</title></svelte:head>
<svelte:window onkeydown={onKey} />
<svelte:document
	onvisibilitychange={() => {
		if (document.hidden) playing = false;
	}}
/>

<div class="review-layout" class:compact-review={compact}>
	<GameReplay
		{timeline}
		{ply}
		{flipped}
		{playing}
		{compact}
		{evaluation}
		marker={classification && ['Great', 'Brilliant'].includes(classification.name)
			? classification.symbol
			: ''}
		onNavigate={go}
		onPlay={togglePlayback}
		onFlip={() => (flipped = !flipped)}
		onAnalysis={openAnalysis}
		onExport={download}
	/>

	{#if !compact}<aside class="review-details" aria-label="Game analysis">
			<AnalysisPanel
				presentation="sidebar"
				{timeline}
				{demo}
				{ply}
				bind:activeTab
				onNavigate={goFromAnalysis}
			/>
		</aside>{/if}
</div>

{#if compact}
	<AnalysisSheet
		bind:open={app.analysisOpen}
		description={`Review ${white} versus ${black}. Choose a move to return to the board.`}
	>
		<AnalysisPanel
			presentation="sheet"
			{timeline}
			{demo}
			{ply}
			bind:activeTab
			onNavigate={goFromAnalysis}
		/>
	</AnalysisSheet>
{/if}

<style>
	.review-layout {
		display: grid;
		flex: 1;
		min-height: 0;
		grid-template-columns: minmax(0, 1fr) 370px;
		gap: 24px;
		align-items: stretch;
	}
	.review-layout.compact-review {
		grid-template-columns: minmax(0, 1fr);
	}
	@media (max-width: 760px) {
		.review-layout {
			grid-template-columns: minmax(0, 1fr);
			gap: 0;
		}
	}
	/* Hide the column before the media listener remounts the sheet on resize. */
	@media (max-width: 1199px), (max-height: 619px) {
		.review-layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}
	.review-details {
		min-width: 0;
	}
	.review-details {
		min-height: 0;
		max-height: none;
		overflow-y: auto;
		overscroll-behavior: contain;
		scrollbar-width: thin;
		scrollbar-color: #c2c9b4 transparent;
		scrollbar-gutter: stable;
		padding: 0 2px 2px;
	}
	@media (max-width: 1199px), (max-height: 619px) {
		.review-details {
			display: none;
		}
	}
</style>
