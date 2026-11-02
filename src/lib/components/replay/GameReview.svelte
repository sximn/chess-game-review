<script lang="ts">
	import { onMount, onDestroy, untrack } from 'svelte';
	import { page } from '$app/state';
	import GameReplay from '#lib/components/replay/GameReplay.svelte';
	import AnalysisPanel from '#lib/components/analysis/AnalysisPanel.svelte';
	import AnalysisSheet from '#lib/components/analysis/AnalysisSheet.svelte';
	import {
		app,
		notify,
		selectGame,
		getReviewPosition,
		rememberReviewPosition
	} from '#lib/state.svelte.js';
	import { parseGame, type SavedGame } from '#lib/chess.js';
	import { ReviewController, emptyReview, type ReviewState } from '#lib/engine/review.js';
	import { visualValue, formatScore } from '#lib/engine/classification.js';
	import { branchTimeline, type Exploration } from '#lib/engine/presentation.js';
	import { Capacitor } from '@capacitor/core';
	import { App } from '@capacitor/app';

	let controller = $state<ReviewController | null>(null);
	let review = $state<ReviewState>(emptyReview());
	let branch = $state<Exploration | null>(null);
	let { game }: { game: SavedGame } = $props();
	let timeline = $derived(parseGame(game.pgn));
	let ply = $state(untrack(() => Math.min(getReviewPosition(game.id), timeline.moves.length)));
	let flipped = $state(false);
	let playing = $state(false);
	let compact = $state(true);
	let activeTab = $state('overview');
	let previousId = '';
	let classification = $derived(review.qualities[ply]);
	let currentResult = $derived(
		// Keep the existing score while a deeper search streams intermediate iterations.
		review.alternatives[ply] ??
			review.positions[ply] ??
			(review.selectedPly === ply ? review.selectedLive : undefined)
	);
	let evaluation = $derived(branch ? null : visualValue(currentResult));
	let evaluationLabel = $derived(
		formatScore(
			currentResult?.terminalScore ?? currentResult?.lines[0]?.score,
			currentResult?.winner
		)
	);
	let analysisDetail = $derived(page.url.searchParams.get('analysis') === 'detail');
	let beforeResult = $derived(review.positions[ply - 1]);

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
		if (previousId) {
			rememberReviewPosition(previousId, ply);
		}
		app.analysisOpen = false;
	});

	$effect(() => {
		if (!controller) {
			return;
		}

		if (game.id !== previousId) {
			if (previousId) {
				rememberReviewPosition(previousId, ply);
			}

			previousId = game.id;
			activeTab = 'overview';
			ply = Math.min(getReviewPosition(game.id), timeline.moves.length);
			selectGame(game.id);
			playing = false;
			branch = null;
			controller.reviewGame(game.pgn, { selectedPly: ply });
			app.analysisOpen = false;
		}
	});
	$effect(() => {
		controller?.selectPosition(ply);
	});
	$effect(() => {
		if (!playing) {
			return;
		}

		const interval = setInterval(() => {
			if (ply < timeline.moves.length) ply++;
			else playing = false;
		}, 1200);

		return () => clearInterval(interval);
	});

	function go(value: number) {
		playing = false;
		branch = null;
		ply = Math.max(0, Math.min(timeline.moves.length, value));
	}

	function goFromAnalysis(value: number) {
		branch = null;
		go(value);

		if (compact) {
			app.analysisOpen = false;
		}
	}

	function togglePlayback() {
		branch = null;

		if (ply === timeline.moves.length) {
			ply = 0;
		}

		playing = !playing;
	}

	function explore(rootPly: number, pv: string[], step = 1) {
		playing = false;
		// Keep the review cursor anchored while the variation has its own cursor.
		const line = branchTimeline(timeline, rootPly, pv);
		if (!line.moves.length) return;
		branch = { timeline: line, rootPly, ply: Math.max(0, Math.min(step, line.moves.length)) };

		if (compact) app.analysisOpen = false;
	}

	function openAnalysis() {
		playing = false;
		app.analysisOpen = true;
	}

	function onKey(event: KeyboardEvent) {
		if (app.importOpen || app.helpOpen || app.analysisOpen || app.menuOpen) {
			return;
		}

		const target = event.target;
		if (
			target instanceof HTMLElement &&
			(['INPUT', 'TEXTAREA'].includes(target.tagName) ||
				target.isContentEditable ||
				target.closest('[role="grid"],[role="tablist"],[role="menu"]'))
		) {
			return;
		}

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
		if (event.key === 'Escape') {
			branch = null;
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
	<div class="board-workspace">
		<GameReplay
			{timeline}
			{ply}
			{branch}
			{flipped}
			{playing}
			{compact}
			{evaluation}
			{evaluationLabel}
			quality={classification}
			reviewPhase={review.phase}
			{analysisDetail}
			beforeEvaluation={visualValue(beforeResult)}
			beforeEvaluationLabel={formatScore(
				beforeResult?.terminalScore ?? beforeResult?.lines[0]?.score,
				beforeResult?.winner
			)}
			marker={!branch && classification && ['Great', 'Brilliant'].includes(classification.name)
				? classification.symbol
				: ''}
			onNavigate={go}
			onPlay={togglePlayback}
			onFlip={() => (flipped = !flipped)}
			onAnalysis={openAnalysis}
			onExport={download}
			onExplore={explore}
			onReveal={() => (playing = false)}
		/>
	</div>

	{#if !compact}
		<aside class="review-details" aria-label="Game analysis">
			<AnalysisPanel
				presentation="sidebar"
				{timeline}
				{review}
				{ply}
				{analysisDetail}
				bind:activeTab
				onNavigate={goFromAnalysis}
				onExplore={explore}
				onPause={() => controller?.pauseReview()}
				onResume={() => controller?.resumeReview()}
				onRetry={() => controller?.retry()}
			/>
		</aside>
	{/if}
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
			{analysisDetail}
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
