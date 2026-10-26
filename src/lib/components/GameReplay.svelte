<script lang="ts">
	import type { Timeline } from '#lib/chess.js';
	import { app } from '#lib/state.svelte.js';
	import Board from './Board.svelte';
	import PlayerRow from './PlayerRow.svelte';
	import MoveControls from './MoveControls.svelte';
	let {
		timeline,
		ply,
		flipped,
		playing,
		compact,
		evaluation,
		marker,
		onNavigate,
		onPlay,
		onFlip,
		onAnalysis
	}: {
		timeline: Timeline;
		ply: number;
		flipped: boolean;
		playing: boolean;
		compact: boolean;
		evaluation: number | null;
		marker: string;
		onNavigate: (ply: number) => void;
		onPlay: () => void;
		onFlip: () => void;
		onAnalysis: () => void;
	} = $props();
	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');
	let result = $derived(timeline.headers.Result || '*');
	let currentMove = $derived(timeline.moves[ply - 1]);
</script>

<section class="board-panel" class:no-evaluation={!app.showEvaluation} aria-label="Game replay">
	<div class="position-area">
		<div class="position-frame">
			<PlayerRow
				position="opponent"
				name={flipped ? white : black}
				whitePiece={flipped}
				showEvaluation={app.showEvaluation}
			/>
			<Board
				fen={timeline.fens[ply] ?? timeline.fens[0]}
				{flipped}
				lastMove={currentMove}
				{evaluation}
				{marker}
			/>
			<PlayerRow
				position="self"
				name={flipped ? black : white}
				whitePiece={!flipped}
				showEvaluation={app.showEvaluation}
				winner={result === (flipped ? '0-1' : '1-0')}
			/>
		</div>
	</div>
	<MoveControls
		moves={timeline.moves}
		{ply}
		{playing}
		{compact}
		{onNavigate}
		{onPlay}
		{onFlip}
		{onAnalysis}
	/>
</section>

<style>
	/* Composition and available space only; children own their appearance. */
	.board-panel {
		--eval-gutter: 21px;
		min-height: 0;
		min-width: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 12px;
	}
	.board-panel.no-evaluation {
		--eval-gutter: 0px;
	}
	.position-area {
		flex: 1;
		min-height: 0;
		width: 100%;
		container-type: size;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.position-frame {
		width: max(0px, min(100cqw, calc(100cqh - 56px + var(--eval-gutter))));
		flex-shrink: 0;
	}
	@media (max-width: 760px) {
		.board-panel {
			gap: 10px;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.board-panel {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 220px;
			gap: 14px;
		}
		.position-area {
			height: 100%;
			min-width: 0;
		}
	}
	@media (max-height: 400px) and (min-width: 480px) and (max-width: 620px) {
		.board-panel {
			grid-template-columns: minmax(0, 1fr) 200px;
			gap: 10px;
		}
	}
</style>
