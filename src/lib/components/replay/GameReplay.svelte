<script lang="ts">
	import { moveLabel, type Timeline } from '#lib/chess.js';
	import { app } from '#lib/state.svelte.js';
	import Board from './Board.svelte';
	import PlayerRow from './PlayerRow.svelte';
	import MoveControls from './MoveControls.svelte';
	import type { MoveQuality } from '#lib/engine/classification.js';
	import type { ReviewState } from '#lib/engine/review.js';
	import { GitBranch } from 'lucide-svelte';
	import { continuation, type Exploration } from '#lib/engine/presentation.js';

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
		branch,
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
		branch: Exploration | null;
		analysisDetail: boolean;
		beforeEvaluation: number | null;
		beforeEvaluationLabel: string;
		onNavigate: (ply: number) => void;
		onPlay: () => void;
		onFlip: () => void;
		onAnalysis: () => void;
		onExport: () => void;
		onExplore: (ply: number, pv: string[], step?: number) => void;
		onReveal: () => void;
	} = $props();

	let white = $derived(timeline.headers.White || 'White');
	let black = $derived(timeline.headers.Black || 'Black');
	let result = $derived(timeline.headers.Result || '*');
	let currentMove = $derived(timeline.moves[ply - 1]);
	let showingPreview = $state(false);
	let bestLine = $derived.by(() => {
		if (quality?.name === 'Best' || quality?.rootPly !== ply - 1 || !quality.alternative.length)
			return undefined;
		const line = continuation(timeline.fens[quality.rootPly], quality.alternative);
		return line.moves[0]?.lan !== currentMove?.lan ? line : undefined;
	});
	let line = $derived(branch?.timeline ?? bestLine);
	let suggestion = $derived(line?.moves[0]);
	let previewing = $derived(showingPreview && !!suggestion);
	let alternative = $derived(
		!!branch && (branch.rootPly !== quality?.rootPly || suggestion?.lan !== bestLine?.moves[0]?.lan)
	);
	let boardTimeline = $derived(branch?.timeline ?? timeline);
	let boardPly = $derived(branch?.ply ?? ply);
	$effect.pre(() => {
		timeline;
		ply;
		branch;
		showingPreview = false;
	});
	$effect.pre(() => {
		if (!suggestion) showingPreview = false;
	});
	function toggleReveal() {
		if (!suggestion) return;
		if (!showingPreview) {
			onReveal();
			showingPreview = true;
		} else showingPreview = false;
	}
	function exploreStep(step: number) {
		if (!line) return;
		showingPreview = false;
		onExplore(
			branch?.rootPly ?? quality!.rootPly,
			line.moves.map((move) => move.lan),
			step
		);
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') showingPreview = false;
	}}
/>

<section class="board-panel" class:no-evaluation={!app.showEvaluation} aria-label="Game replay">
	<div class="position-area">
		<div
			class="position-frame"
			class:exploring={!!branch || previewing}
		>
			<PlayerRow
				position="opponent"
				name={flipped ? white : black}
				whitePiece={flipped}
				showEvaluation={app.showEvaluation}
				winner={result === (flipped ? '1-0' : '0-1')}
			>
				{#snippet context()}
					{#if branch}
						<div class="variation-badge" role="status">
							<GitBranch size={12} /> Alternative line
							<span>{previewing ? 0 : branch.ply} / {branch.timeline.moves.length}</span>
						</div>
					{/if}
				{/snippet}
			</PlayerRow>

			<div class="board-stage">
				<Board
					fen={previewing
						? suggestion!.before
						: (boardTimeline.fens[boardPly] ?? boardTimeline.fens[0])}
					{flipped}
					lastMove={previewing ? undefined : boardTimeline.moves[boardPly - 1]}
					evaluation={branch ? null : previewing ? beforeEvaluation : evaluation}
					evaluationLabel={branch ? '—' : previewing ? beforeEvaluationLabel : evaluationLabel}
					marker={previewing || branch ? '' : marker}
					suggestedMove={previewing ? suggestion : undefined}
				/>
			</div>

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
		{analysisDetail}
		{suggestion}
		{previewing}
		{alternative}
		lineMoves={line?.moves ?? []}
		linePly={branch ? (previewing ? 0 : branch.ply) : undefined}
		onToggleReveal={toggleReveal}
		onExplore={exploreStep}
		onNavigate={(value) => {
			showingPreview = false;
			onNavigate(value);
		}}
		onPlay={() => {
			showingPreview = false;
			onPlay();
		}}
		{onFlip}
		onAnalysis={() => {
			showingPreview = false;
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
	.board-stage {
		position: relative;
		isolation: isolate;
	}
	.board-stage :global(.chessboard) {
		transition:
			filter 220ms,
			box-shadow 220ms;
	}
	.variation-badge {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px;
		border: 1px solid color-mix(in srgb, var(--violet) 45%, var(--paper));
		border-radius: 20px;
		background: var(--paper);
		color: var(--violet);

		font-size: 10px;
		font-weight: 650;
		white-space: nowrap;
		pointer-events: none;
	}
	.variation-badge span {
		color: var(--muted);
		font-size: 9px;
	}
	.exploring .board-stage :global(.chessboard) {
		filter: brightness(0.78) saturate(0.65);
		box-shadow:
			0 0 0 3px var(--violet),
			0 0 0 7px color-mix(in srgb, var(--violet) 12%, transparent);
	}
	@media (prefers-reduced-motion: reduce) {
		.board-stage :global(.chessboard) {
			transition: none;
		}
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
