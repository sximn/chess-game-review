<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { Dialog, DropdownMenu } from 'bits-ui';
	import { Download, Ellipsis, Lightbulb, RotateCcw, Settings2, X } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import Board from '$lib/components/Board.svelte';
	import Knight from '$lib/components/Knight.svelte';
	import AnalysisPanel from '$lib/components/AnalysisPanel.svelte';
	import MoveControls from '$lib/components/MoveControls.svelte';
	import { app, notify } from '$lib/state.svelte';
	import { demoAnalysis, demoEvaluations, parseGame } from '$lib/chess';
	import '$lib/review.css';

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
	let currentMove = $derived(timeline.moves[ply - 1]);
	let classification = $derived(
		demo ? demoAnalysis.find((item) => item.plies.includes(ply)) : undefined
	);
	let evaluation = $derived(demo ? demoEvaluations[ply] : null);
	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');
	let result = $derived(timeline.headers.Result || '*');

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

<svelte:head><title>Game review · Paper & Ink</title></svelte:head>
<svelte:window onkeydown={onKey} />
<svelte:document
	onvisibilitychange={() => {
		if (document.hidden) playing = false;
	}}
/>

<div class="page-heading review-heading">
	<h1>Game review<span class="heading-dot">.</span></h1>
	<DropdownMenu.Root bind:open={app.menuOpen}>
		<DropdownMenu.Trigger class="icon-button game-actions" aria-label="Game actions"
			><Ellipsis size={22} /></DropdownMenu.Trigger
		>
		<DropdownMenu.Portal
			><DropdownMenu.Content class="dropdown-menu">
				<DropdownMenu.Item onclick={download}><Download size={15} /> Export PGN</DropdownMenu.Item>
				<DropdownMenu.Item onclick={() => go(0)}
					><RotateCcw size={15} /> Start from the beginning</DropdownMenu.Item
				>
				<DropdownMenu.Item onclick={() => goto('/settings')}
					><Settings2 size={15} /> Preferences</DropdownMenu.Item
				>
				<DropdownMenu.Item onclick={() => (app.helpOpen = true)}
					><Lightbulb size={15} /> How this review works</DropdownMenu.Item
				>
			</DropdownMenu.Content></DropdownMenu.Portal
		>
	</DropdownMenu.Root>
</div>

<div class="review-layout" class:compact-review={compact}>
	<section class="board-panel" class:no-evaluation={!app.showEvaluation} aria-label="Game replay">
		<div class="position-area">
			<div class="position-frame">
				<div class="player-row opponent">
					<div class="player-avatar dark-player"><Knight size={25} /></div>
					<div class="player-details"><strong>{flipped ? white : black}</strong></div>
					<span class="piece-color" class:white-piece={flipped}></span>
				</div>
				<Board
					fen={timeline.fens[ply] ?? timeline.fens[0]}
					{flipped}
					lastMove={currentMove}
					{evaluation}
					marker={classification && ['Great', 'Brilliant'].includes(classification.name)
						? classification.symbol
						: ''}
				/>
				<div class="player-row self">
					<div class="player-avatar light-player"><Knight size={25} /></div>
					<div class="player-details">
						<strong
							>{flipped ? black : white}{#if result === (flipped ? '0-1' : '1-0')}<span
									class="player-winner">WINNER</span
								>{/if}</strong
						>
					</div>
					<span class="piece-color" class:white-piece={!flipped}></span>
				</div>
			</div>
		</div>
		<MoveControls
			moves={timeline.moves}
			{ply}
			{playing}
			{compact}
			onNavigate={go}
			onPlay={togglePlayback}
			onFlip={() => (flipped = !flipped)}
			onAnalysis={openAnalysis}
		/>
	</section>
	{#if !compact}<aside class="review-details" aria-label="Game analysis">
			<AnalysisPanel {timeline} {demo} {ply} bind:activeTab onNavigate={goFromAnalysis} />
		</aside>{/if}
</div>

{#if compact}
	<Dialog.Root bind:open={app.analysisOpen}>
		<Dialog.Portal
			><Dialog.Overlay class="dialog-overlay" /><Dialog.Content class="analysis-sheet">
				<div class="dialog-handle"></div>
				<div class="analysis-sheet-heading">
					<Dialog.Title>Game analysis</Dialog.Title><Dialog.Close
						class="icon-button"
						aria-label="Close analysis"><X size={21} /></Dialog.Close
					>
				</div>
				<Dialog.Description class="visually-hidden"
					>Review {white} versus {black}. Choose a move to return to the board.</Dialog.Description
				>
				<div class="analysis-sheet-scroll">
					<AnalysisPanel {timeline} {demo} {ply} bind:activeTab onNavigate={goFromAnalysis} />
				</div>
			</Dialog.Content></Dialog.Portal
		>
	</Dialog.Root>
{/if}
