<script lang="ts">
	import { moveLabel, type Timeline } from '#lib/chess.js';
	import { app } from '#lib/state.svelte.js';
	import Board from './Board.svelte';
	import PlayerRow from './PlayerRow.svelte';
	import MoveControls from './MoveControls.svelte';
	import type { MoveQuality } from '#lib/engine/classification.js';
	import type { ReviewState } from '#lib/engine/review.js';
	import { continuation } from '#lib/engine/presentation.js';

	let {
		timeline,
		ply,
		flipped,
		playing,
		compact,
		evaluation,
		evaluationLabel,
		marker,
		quality,
		reviewPhase,
		exploring,
		analysisDetail,
		beforeEvaluation,
		beforeEvaluationLabel,
		onNavigate,
		onPlay,
		onFlip,
		onAnalysis,
		onExport,
		onExplore,
		onReveal
	}: {
		timeline: Timeline;
		ply: number;
		flipped: boolean;
		playing: boolean;
		compact: boolean;
		evaluation: number | null;
		evaluationLabel: string;
		marker: string;
		quality?: MoveQuality;
		reviewPhase: ReviewState['phase'];
		exploring: boolean;
		analysisDetail: boolean;
		beforeEvaluation: number | null;
		beforeEvaluationLabel: string;
		onNavigate: (ply: number) => void;
		onPlay: () => void;
		onFlip: () => void;
		onAnalysis: () => void;
		onExport: () => void;
		onExplore: (ply: number, pv: string[]) => void;
		onReveal: () => void;
	} = $props();

	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');
	let result = $derived(timeline.headers.Result || '*');
	let currentMove = $derived(timeline.moves[ply - 1]);
	let expanded = $state(false);
	let suggestion = $derived(
		!exploring && quality?.rootPly === ply - 1 && quality.alternative.length
			? continuation(timeline.fens[quality.rootPly], [quality.alternative[0]]).moves[0]
			: undefined
	);
	let previewing = $derived(expanded && !!suggestion);
	$effect.pre(() => {
		timeline;
		ply;
		exploring;
		expanded = false;
	});
	function toggleReveal() {
		if (!expanded) onReveal();
		expanded = !expanded;
	}

	let fen = $state('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') expanded = false;
	}}
/>

<section class="board-panel" class:no-evaluation={!app.showEvaluation} aria-label="Game replay">
	<div class="position-area">
		<div class="position-frame" class:showing-suggestion={previewing}>
			<PlayerRow
				position="opponent"
				name={flipped ? white : black}
				whitePiece={flipped}
				showEvaluation={app.showEvaluation}
				winner={result === (flipped ? '1-0' : '0-1')}
			/>
			<Board
				fen={previewing ? suggestion!.before : (timeline.fens[ply] ?? timeline.fens[0])}
				{flipped}
				lastMove={previewing ? undefined : currentMove}
				evaluation={previewing ? beforeEvaluation : evaluation}
				evaluationLabel={previewing ? beforeEvaluationLabel : evaluationLabel}
				marker={previewing ? '' : marker}
				suggestedMove={previewing ? suggestion : undefined}
				// movable="w"
				// onMove={(move) => {
				// 	fen = move.after;
				// 	currentMove = move;
				// }}
			/>
			{#if previewing}<div class="board-preview-note" role="status">
					Position before {moveLabel(ply, timeline.moves)}
				</div>{/if}
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
		{quality}
		{reviewPhase}
		{exploring}
		{analysisDetail}
		{suggestion}
		{expanded}
		onToggleReveal={toggleReveal}
		onExplore={() => {
			if (quality) onExplore(quality.rootPly, quality.alternative);
		}}
		{onNavigate}
		onPlay={() => {
			expanded = false;
			onPlay();
		}}
		{onFlip}
		onAnalysis={() => {
			expanded = false;
			onAnalysis();
		}}
		{onExport}
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
		align-items: start;
		justify-content: center;
	}
	.position-frame {
		width: max(
			0px,
			min(100cqw, calc(100cqh - 56px - var(--preview-height, 0px) + var(--eval-gutter)))
		);
		flex-shrink: 0;
	}
	.position-frame.showing-suggestion {
		--preview-height: 22px;
	}
	.board-preview-note {
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: var(--eval-gutter);
		color: var(--muted);
		font-size: 10px;
		background: var(--surface-green);
		border-radius: 0 0 6px 6px;
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
