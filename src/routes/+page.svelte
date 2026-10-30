<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import GameReplay from '#lib/components/GameReplay.svelte';
	import AnalysisPanel from '#lib/components/AnalysisPanel.svelte';
	import AnalysisSheet from '#lib/components/AnalysisSheet.svelte';
	import { app, notify } from '#lib/state.svelte.js';
	import { parseGame, type Timeline } from '#lib/chess.js';

	import { ReviewController, emptyReview, type ReviewState } from '#lib/engine/review.js';
	import { visualValue, formatScore } from '#lib/engine/classification.js';
	import { branchTimeline } from '#lib/engine/presentation.js';
	import { Capacitor } from '@capacitor/core';
	import { App } from '@capacitor/app';
	let controller = $state<ReviewController | null>(null);
	let review = $state<ReviewState>(emptyReview());
	let branch = $state<{ timeline: Timeline; ply: number } | null>(null);
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
	let classification = $derived(review.qualities[ply]);
	let currentResult = $derived(
		review.selectedLive ?? review.alternatives[ply] ?? review.positions[ply]
	);
	let evaluation = $derived(branch ? null : visualValue(currentResult));
	let evaluationLabel = $derived(
		formatScore(
			currentResult?.terminalScore ?? currentResult?.lines[0]?.score,
			currentResult?.winner
		)
	);
	let displayTimeline = $derived(branch?.timeline ?? timeline);
	let displayPly = $derived(branch?.ply ?? ply);

	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');

	onMount(() => {
		controller = new ReviewController((state) => {
			review = state;
		});
		const onVisibility = () => controller?.setVisible(!document.hidden);
		document.addEventListener('visibilitychange', onVisibility);
		let destroyed = false;
		let removeNative: (() => void) | undefined;
		if (Capacitor.isNativePlatform())
			void App.addListener('appStateChange', ({ isActive }) =>
				controller?.setVisible(isActive)
			).then((handle) => {
				if (destroyed) void handle.remove();
				else
					removeNative = () => {
						void handle.remove();
					};
			});

		const wide = matchMedia('(min-width: 1200px) and (min-height: 620px)');
		const update = () => {
			compact = !wide.matches;
			if (wide.matches) app.analysisOpen = false;
		};
		update();
		wide.addEventListener('change', update);
		return () => {
			wide.removeEventListener('change', update);
			document.removeEventListener('visibilitychange', onVisibility);
			destroyed = true;
			removeNative?.();
			controller?.dispose();
		};
	});
	onDestroy(() => {
		app.analysisOpen = false;
	});
	$effect(() => {
		if (!controller) return;
		if (game.id !== previousId) {
			previousId = game.id;
			activeTab = 'overview';
			ply = demo ? 19 : 0;
			playing = false;
			branch = null;
			controller.reviewGame(game.pgn, { selectedPly: demo ? 19 : 0 });
			app.analysisOpen = false;
		}
	});
	$effect(() => {
		controller?.selectPosition(ply);
	});
	$effect(() => {
		if (!playing) return;
		const interval = setInterval(() => {
			if (displayPly < displayTimeline.moves.length) {
				if (branch) branch = { ...branch, ply: branch.ply + 1 };
				else ply++;
			} else playing = false;
		}, 1200);
		return () => clearInterval(interval);
	});
	function go(value: number) {
		playing = false;
		if (branch)
			branch = { ...branch, ply: Math.max(0, Math.min(branch.timeline.moves.length, value)) };
		else ply = Math.max(0, Math.min(timeline.moves.length, value));
	}
	function goFromAnalysis(value: number) {
		branch = null;
		go(value);
		if (compact) app.analysisOpen = false;
	}
	function togglePlayback() {
		if (displayPly === displayTimeline.moves.length) {
			if (branch) branch = { ...branch, ply: 0 };
			else ply = 0;
		}
		playing = !playing;
	}
	function explore(rootPly: number, pv: string[]) {
		playing = false;
		ply = rootPly;
		branch = { timeline: branchTimeline(timeline, rootPly, pv), ply: Math.min(1, pv.length) };
		if (compact) app.analysisOpen = false;
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
			go(displayPly - 1);
		}
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			go(displayPly + 1);
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
			go(displayTimeline.moves.length);
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
	<div class="board-workspace">
		{#if branch}<div class="branch-banner">
				<span>Exploring an alternative</span><button
					onclick={() => {
						branch = null;
						playing = false;
					}}>Return to game</button
				>
			</div>{/if}
		<GameReplay
			timeline={displayTimeline}
			ply={displayPly}
			{flipped}
			{playing}
			{compact}
			{evaluation}
			{evaluationLabel}
			marker={!branch && classification && ['Great', 'Brilliant'].includes(classification.name)
				? classification.symbol
				: ''}
			onNavigate={go}
			onPlay={togglePlayback}
			onFlip={() => (flipped = !flipped)}
			onAnalysis={openAnalysis}
			onExport={download}
		/>
	</div>

	{#if !compact}<aside class="review-details" aria-label="Game analysis">
			<AnalysisPanel
				presentation="sidebar"
				{timeline}
				{review}
				{ply}
				bind:activeTab
				onNavigate={goFromAnalysis}
				onExplore={explore}
				onPause={() => controller?.pauseReview()}
				onResume={() => controller?.resumeReview()}
				onRetry={() => controller?.retry()}
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
			{review}
			{ply}
			bind:activeTab
			onNavigate={goFromAnalysis}
			onExplore={explore}
			onPause={() => controller?.pauseReview()}
			onResume={() => controller?.resumeReview()}
			onRetry={() => controller?.retry()}
		/>
	</AnalysisSheet>
{/if}

<style>
	.board-workspace {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		gap: 8px;
	}
	.board-workspace :global(.board-panel) {
		flex: 1;
		min-height: 0;
	}
	.branch-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		border: 1px solid var(--line);
		background: var(--paper);
		border-radius: 8px;
		padding: 6px 10px;
		font-size: 11px;
	}
	.branch-banner button {
		border-radius: 6px;
		background: var(--surface-green);
		padding: 8px;
		min-height: 32px;
		font-size: 11px;
	}

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
