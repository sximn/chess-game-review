<script lang="ts">
	import type { AnalysisPresentation } from './analysis.types';
	import type { Move } from 'chess.js';
	import { demoAnalysis, moveLabel } from '#lib/chess.js';
	let {
		presentation,
		values,
		moves,
		ply,
		onNavigate
	}: {
		presentation: AnalysisPresentation;
		values: number[] | null;
		moves: Move[];
		ply: number;
		onNavigate: (ply: number) => void;
	} = $props();
	const chartY = (value: number) => 60 - 48 * Math.tanh(value / 3);
	let curve = $derived.by(() => {
		if (!values || values.length < 2) return '';
		const step = 600 / (values.length - 1);
		const ys = values.map(chartY);
		const slopes = ys.slice(1).map((y, i) => (y - ys[i]) / step);
		const tangents = ys.map((_, i) => {
			if (i === 0) return slopes[0];
			if (i === ys.length - 1) return slopes.at(-1)!;
			const before = slopes[i - 1],
				after = slopes[i];
			return before * after <= 0 ? 0 : (2 * before * after) / (before + after);
		});
		return ys.reduce(
			(path, y, i) =>
				i === 0
					? `M0,${y}`
					: `${path} C${(i - 1) * step + step / 3},${ys[i - 1] + (tangents[i - 1] * step) / 3} ${i * step - step / 3},${y - (tangents[i] * step) / 3} ${i * step},${y}`,
			''
		);
	});
	let moments = $derived(
		values
			? [18, 19, 25, 28, 31, 33]
					.filter((index) => index <= moves.length)
					.map((index) => ({
						ply: index,
						label: moveLabel(index, moves),
						quality: demoAnalysis.find((quality) => quality.plies.includes(index)),
						color: moves[index - 1].color,
						y: (chartY(values[index]) / 120) * 100
					}))
			: []
	);
</script>

<section
	class="evaluation-card evaluation-timeline"
	data-presentation={presentation}
	aria-label="Evaluation timeline"
>
	<div class="evaluation-title">
		<div>
			<h3>{values ? 'Evaluation' : 'Game timeline'}</h3>
			<span>{values ? 'Sample analysis' : `${moves.length} half-moves`}</span>
		</div>
		{#if values}<div class="evaluation-sides" aria-label="Evaluation from White’s perspective">
				<span><i class="white-side"></i> White</span><span><i class="black-side"></i> Black</span>
			</div>{/if}
	</div>
	<div class="evaluation-plot">
		{#if values}
			<div class="advantage-zone white-zone"><span>White advantage</span></div>
			<div class="advantage-zone black-zone"><span>Black advantage</span></div>
			<svg viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
				<defs
					><clipPath id="white-evaluation"><rect width="600" height="60" /></clipPath><clipPath
						id="black-evaluation"><rect y="60" width="600" height="60" /></clipPath
					></defs
				>
				<path
					d={`${curve} L600,60 L0,60 Z`}
					fill="#8da57b"
					fill-opacity=".23"
					clip-path="url(#white-evaluation)"
				/>
				<path
					d={`${curve} L600,60 L0,60 Z`}
					fill="#454c40"
					fill-opacity=".3"
					clip-path="url(#black-evaluation)"
				/>
				<path
					d={curve}
					fill="none"
					stroke="#6d8a58"
					stroke-width="2.4"
					vector-effect="non-scaling-stroke"
					clip-path="url(#white-evaluation)"
				/>
				<path
					d={curve}
					fill="none"
					stroke="#454c40"
					stroke-width="2.4"
					vector-effect="non-scaling-stroke"
					clip-path="url(#black-evaluation)"
				/>
			</svg>
			<div class="evaluation-zero"><span>0</span></div>
		{:else}<div class="replay-progress" style:width={`${(ply / moves.length) * 100}%`}></div>{/if}
		<div class="evaluation-cursor" style:left={`${(ply / moves.length) * 100}%`}><span></span></div>
		<input
			aria-label="Navigate game timeline"
			type="range"
			min="0"
			max={moves.length}
			value={ply}
			oninput={(event) => onNavigate(Number(event.currentTarget.value))}
		/>
		{#each moments as moment}
			<button
				class="graph-moment"
				class:selected={ply === moment.ply}
				class:black-moment={moment.color === 'b'}
				style={`left:${(moment.ply / moves.length) * 100}%;top:${moment.y}%;--moment-color:${moment.quality?.color ?? '#648c51'}`}
				aria-label={`Go to ${moment.label}, ${moment.color === 'w' ? 'White' : 'Black'}, ${moment.quality?.name ?? 'checkmate'}`}
				aria-pressed={ply === moment.ply}
				title={`${moment.label} · ${moment.quality?.name ?? 'Checkmate'}`}
				onclick={() => onNavigate(moment.ply)}><span></span></button
			>
		{/each}
	</div>
	<div class="chart-axis">
		<span>Opening</span><span>Middlegame</span><span>{moveLabel(moves.length, moves)}</span>
	</div>
	{#if moments.length}<div class="critical-moves" aria-label="Critical moves">
			<span>Key moments</span>{#each moments as moment}<button
					class:current={ply === moment.ply}
					aria-label={`Jump to ${moment.label}`}
					aria-pressed={ply === moment.ply}
					onclick={() => onNavigate(moment.ply)}
					><i class:black-side={moment.color === 'b'}></i>{moment.label}<b
						style:color={moment.quality?.color}>{moment.quality?.symbol}</b
					></button
				>{/each}
		</div>{/if}
</section>

<style>
	.evaluation-card {
		border-radius: 13px;
		background: var(--paper);
		margin: 0;
		padding: 16px 20px 14px;
		border: 0;
		box-shadow: none;
	}
	.evaluation-title {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.evaluation-title > div {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.evaluation-title h3 {
		font-size: 10px;
		font-weight: 650;
		letter-spacing: -0.2px;
	}
	.evaluation-title > div > span {
		color: #aab09b;
		font-size: 8px;
		margin-left: 4px;
	}
	.chart-axis {
		display: flex;
		justify-content: space-between;
		padding-top: 7px;
		color: #b4b9a5;
		font-size: 7px;
	}
	.replay-progress {
		height: 100%;
		background: linear-gradient(180deg, #a9bb8c44, #a9bb8c11);
		border-right: 2px solid #97ab7b;
	}
	@media (max-width: 760px) {
		.evaluation-title h3 {
			font-size: 11px;
		}
		.evaluation-title > div > span {
			font-size: 7px;
		}
		.evaluation-title > div {
			gap: 6px;
		}
		.chart-axis {
			font-size: 8px;
		}
	}
	@media (min-width: 1001px) {
		.evaluation-title h3 {
			font-size: 12px;
		}
		.evaluation-title > div > span {
			font-size: 9px;
		}
		.chart-axis {
			font-size: 9px;
		}
	}
	.evaluation-sides {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.evaluation-sides > span {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 10px;
		color: var(--muted);
	}
	.evaluation-sides i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #fffbee;
		border: 1px solid #abae9c;
		flex-shrink: 0;
	}
	.critical-moves i {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #fffbee;
		border: 1px solid #abae9c;
		flex-shrink: 0;
	}
	.evaluation-sides .black-side {
		background: #454c40;
		border-color: #454c40;
	}
	.critical-moves .black-side {
		background: #454c40;
		border-color: #454c40;
	}
	.evaluation-plot {
		height: 125px;
		margin: 14px 12px 0;
		position: relative;
		isolation: isolate;
	}
	.evaluation-plot > svg {
		position: absolute;
		width: 100%;
		height: 100%;
		inset: 0;
		z-index: 1;
		pointer-events: none;
	}
	.advantage-zone {
		position: absolute;
		left: 0;
		right: 0;
		height: 50%;
		pointer-events: none;
	}
	.white-zone {
		top: 0;
		background: #f7f3e82e;
	}
	.black-zone {
		bottom: 0;
		background: #454c4010;
	}
	.advantage-zone > span {
		position: absolute;
		left: 4px;
		font-size: 8px;
		color: #8c9680;
	}
	.white-zone > span {
		top: 3px;
	}
	.black-zone > span {
		bottom: 3px;
		color: #737b69;
	}
	.evaluation-zero {
		position: absolute;
		top: 50%;
		width: 100%;
		border-top: 1px dashed #aeb69c;
		pointer-events: none;
	}
	.evaluation-zero > span {
		position: absolute;
		right: calc(100% + 6px);
		top: -5px;
		font-size: 8px;
		color: var(--muted);
	}
	.evaluation-plot > input {
		position: absolute;
		inset: 0;
		margin: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		z-index: 2;
		cursor: ew-resize;
	}
	.evaluation-plot:has(> input:focus-visible) {
		outline: 2px solid var(--violet);
		outline-offset: 4px;
		border-radius: 4px;
	}
	.evaluation-cursor {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1px;
		background: #c7ac43;
		pointer-events: none;
		z-index: 1;
		transition: left 0.15s;
	}
	.evaluation-cursor > span {
		position: absolute;
		top: -3px;
		left: -2px;
		width: 5px;
		height: 5px;
		background: var(--yellow);
		border: 1px solid #bba33f;
		border-radius: 50%;
	}
	.graph-moment {
		position: absolute;
		width: 28px;
		height: 28px;
		padding: 0;
		display: grid;
		place-items: center;
		background: none;
		transform: translate(-50%, -50%);
		z-index: 3;
		border-radius: 50%;
	}
	.graph-moment > span {
		display: block;
		width: 10px;
		height: 10px;
		background: #fffbee;
		border: 2px solid var(--moment-color);
		border-radius: 50%;
		box-shadow: 0 1px 2px #0002;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}
	.graph-moment.black-moment > span {
		background: #454c40;
	}
	.graph-moment.selected > span {
		transform: scale(1.35);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--moment-color) 20%, transparent);
	}
	.graph-moment:hover > span {
		transform: scale(1.4);
	}
	.graph-moment:focus-visible > span {
		transform: scale(1.4);
	}
	.graph-moment:active:not(:disabled) {
		transform: translate(-50%, -50%);
	}
	.evaluation-timeline .chart-axis {
		margin: 3px 12px 0;
		font-size: 9px;
	}
	.critical-moves {
		display: flex;
		gap: 7px;
		align-items: center;
		flex-wrap: wrap;
		margin-top: 14px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}
	.critical-moves > span {
		font-size: 9px;
		color: var(--muted);
		margin-right: 4px;
		width: 100%;
	}
	.critical-moves > button {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 9px;
		min-height: 30px;
		border-radius: 7px;
		padding: 0 8px;
		background: var(--bg);
		border: 1px solid var(--line);
	}
	.critical-moves > button.current {
		border-color: #c5b8ec;
		background: color-mix(in srgb, var(--violet) 9%, var(--paper));
	}
	.critical-moves b {
		font-size: 9px;
	}
	:global(:root[data-theme='dark']) .black-zone {
		background: #10140d36;
	}
	:global(:root[data-theme='dark']) .white-zone {
		background: #e9efda0b;
	}
	.evaluation-card[data-presentation='sheet'] .evaluation-plot {
		height: 170px;
	}
</style>
