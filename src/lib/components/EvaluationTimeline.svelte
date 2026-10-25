<script lang="ts">
	import type { Move } from 'chess.js';
	import { demoAnalysis, moveLabel } from '#lib/chess.js';
	let {
		values,
		moves,
		ply,
		onNavigate
	}: {
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

<section class="evaluation-card evaluation-timeline" aria-label="Evaluation timeline">
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
