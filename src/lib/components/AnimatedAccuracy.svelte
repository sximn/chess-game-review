<script lang="ts">
	import type { AnalysisPresentation } from './analysis.types';
	import { onMount } from 'svelte';
	let {
		presentation,
		whiteName,
		blackName,
		whiteAccuracy = 94.2,
		blackAccuracy = 78.6
	}: {
		presentation: AnalysisPresentation;
		whiteName: string;
		blackName: string;
		whiteAccuracy?: number;
		blackAccuracy?: number;
	} = $props();
	let progress = $state(0);
	let whiteValue = $derived((whiteAccuracy * progress).toFixed(1));
	let blackValue = $derived((blackAccuracy * progress).toFixed(1));
	onMount(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		let frame = 0;
		let start: number | undefined;
		const finish = () => {
			if (reduced.matches) {
				cancelAnimationFrame(frame);
				progress = 1;
			}
		};
		const animate = (now: number) => {
			start ??= now;
			const elapsed = Math.min(1, (now - start) / 1100);
			progress = 1 - Math.pow(1 - elapsed, 3);
			if (elapsed < 1) frame = requestAnimationFrame(animate);
		};
		if (reduced.matches) progress = 1;
		else frame = requestAnimationFrame(animate);
		reduced.addEventListener('change', finish);
		return () => {
			cancelAnimationFrame(frame);
			reduced.removeEventListener('change', finish);
		};
	});
</script>

<div class="accuracy-comparison animated-accuracy" data-presentation={presentation}>
	<div class="accuracy-ring" aria-label={`${whiteName} accuracy ${whiteAccuracy} percent`}>
		<svg viewBox="0 0 120 120" aria-hidden="true"
			><circle class="ring-track" cx="60" cy="60" r="51" /><circle
				class="ring-fill"
				cx="60"
				cy="60"
				r="51"
				stroke-dasharray="320.44"
				stroke-dashoffset={320.44 * (1 - (whiteAccuracy * progress) / 100)}
			/></svg
		>
		<div aria-hidden="true">
			<strong>{whiteValue.split('.')[0]}<span>.{whiteValue.split('.')[1]}</span></strong><span
				>ACCURACY</span
			>
		</div>
	</div>
	<div class="accuracy-players">
		<div>
			<span class="color-dot white-dot"></span><span>{whiteName}</span><strong
				aria-label={`${whiteAccuracy} percent`}><span aria-hidden="true">{whiteValue}</span></strong
			>
		</div>
		<div
			class="comparison-bar"
			role="progressbar"
			aria-label={`${whiteName} accuracy`}
			aria-valuenow={whiteAccuracy}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<span style:width={`${whiteAccuracy * progress}%`}></span>
		</div>
		<div>
			<span class="color-dot black-dot"></span><span>{blackName}</span><strong
				class="muted"
				aria-label={`${blackAccuracy} percent`}><span aria-hidden="true">{blackValue}</span></strong
			>
		</div>
		<div
			class="comparison-bar black-bar"
			role="progressbar"
			aria-label={`${blackName} accuracy`}
			aria-valuenow={blackAccuracy}
			aria-valuemin={0}
			aria-valuemax={100}
		>
			<span style:width={`${blackAccuracy * progress}%`}></span>
		</div>
	</div>
</div>

<style>
	.accuracy-comparison {
		display: flex;
		gap: 19px;
		align-items: center;
		margin: 23px 0 22px;
	}
	.accuracy-ring {
		position: relative;
		width: 107px;
		height: 107px;
		flex-shrink: 0;
	}
	.accuracy-ring > svg {
		width: 100%;
		height: 100%;
		transform: rotate(-90deg);
	}
	.accuracy-ring circle {
		fill: none;
		stroke-width: 5.5;
		stroke-linecap: round;
	}
	.ring-track {
		stroke: var(--paper-deep);
	}
	.ring-fill {
		stroke: var(--sage);
		transition: none;
	}
	.accuracy-ring > div {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
	}
	.accuracy-ring strong {
		font-size: 30px;
		font-weight: 600;
		letter-spacing: -1.3px;
		line-height: 1.2;
	}
	.accuracy-ring strong > span {
		font-size: 22px;
	}
	.accuracy-ring > div > span {
		font-size: 6px;
		letter-spacing: 1px;
		color: #9ea38f;
		font-weight: 600;
		margin-top: 4px;
	}
	.accuracy-players {
		flex: 1;
		min-width: 0;
	}
	.accuracy-players > div:not(.comparison-bar) {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 8px;
		white-space: nowrap;
	}
	.accuracy-players strong {
		margin-left: auto;
		font-size: 10px;
		font-weight: 700;
	}
	.color-dot {
		display: inline-block;
		flex-shrink: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}
	.white-dot {
		background: #f7f3e2;
		border: 1px solid #c7c9b5;
	}
	.black-dot {
		background: #5a6250;
		border: 1px solid #5a6250;
	}
	.comparison-bar {
		height: 10px;
		background: var(--paper-deep);
		border-radius: 999px;
		overflow: visible;
		margin: 8px 0 17px;
		box-shadow: inset 0 1px 3px rgb(var(--sc) / 0.16);
	}
	.comparison-bar > span {
		display: block;
		height: 100%;
		background: linear-gradient(180deg, #b2c79c, #86a66f);
		border-radius: inherit;
		box-shadow:
			inset 0 1px rgb(255 255 255 / 0.65),
			0 0 0 1px #7c985d,
			0 2px 3px rgb(var(--sc) / 0.16);
		transition: none;
	}
	.comparison-bar.black-bar {
		margin-bottom: 2px;
	}
	@media (min-width: 1500px) {
		.accuracy-comparison {
			margin: 28px 0;
		}
		.accuracy-ring {
			width: 123px;
			height: 123px;
		}
		.accuracy-players > div:not(.comparison-bar) {
			font-size: 9px;
		}
	}
	@media (max-width: 1200px) {
		.accuracy-comparison {
			gap: 13px;
		}
		.accuracy-ring {
			width: 92px;
			height: 92px;
		}
		.accuracy-ring strong {
			font-size: 27px;
		}
		.accuracy-ring strong > span {
			font-size: 19px;
		}
		.accuracy-players > div:not(.comparison-bar) {
			font-size: 7px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.accuracy-comparison {
			gap: 10px;
			margin: 18px 0;
		}
		.accuracy-ring {
			width: 79px;
			height: 79px;
		}
		.accuracy-ring strong {
			font-size: 24px;
		}
		.accuracy-ring strong > span {
			font-size: 16px;
		}
		.accuracy-ring > div > span {
			font-size: 5px;
		}
		.accuracy-players strong {
			font-size: 8px;
		}
		.accuracy-players > div:not(.comparison-bar) {
			gap: 3px;
			font-size: 6.5px;
		}
		.accuracy-players .color-dot {
			width: 5px;
			height: 5px;
		}
	}
	@media (max-width: 760px) {
		.accuracy-comparison {
			gap: 28px;
			margin: 24px 0;
			justify-content: center;
		}
		.accuracy-ring {
			width: 117px;
			height: 117px;
		}
		.accuracy-ring strong {
			font-size: 34px;
		}
		.accuracy-ring strong > span {
			font-size: 25px;
		}
		.accuracy-ring > div > span {
			font-size: 6.5px;
		}
		.accuracy-players {
			max-width: 180px;
		}
		.accuracy-players > div:not(.comparison-bar) {
			font-size: 9px;
		}
		.accuracy-players strong {
			font-size: 11px;
		}
	}
	@media (max-width: 360px) {
		.accuracy-comparison {
			gap: 18px;
		}
		.accuracy-ring {
			width: 98px;
			height: 98px;
		}
		.accuracy-players > div:not(.comparison-bar) {
			font-size: 8px;
		}
	}
	:global(:root[data-theme='dark']) .accuracy-players > div {
		color: #b7c0a7;
	}
	@media (min-width: 1001px) {
		.accuracy-players > div:not(.comparison-bar) {
			font-size: 9px;
		}
		.accuracy-players strong {
			font-size: 11px;
		}
		.accuracy-comparison {
			margin: 19px 0;
		}
	}
	.comparison-bar.black-bar > span {
		background: linear-gradient(180deg, #8d957e, #59624e);
		box-shadow:
			inset 0 1px rgb(255 255 255 / 0.3),
			0 0 0 1px #515d43,
			0 2px 3px rgb(var(--sc) / 0.16);
	}
	:global(:root[data-theme='dark']) .comparison-bar > span {
		box-shadow:
			inset 0 1px #ffffff55,
			0 0 0 1px #6a8155,
			0 2px 4px #0004;
	}
	:global(:root[data-theme='dark']) .comparison-bar.black-bar > span {
		background: linear-gradient(#859079, #49583d);
	}
	@media (max-width: 760px) {
		.accuracy-comparison[data-presentation='sheet'] {
			gap: 20px;
		}
		.accuracy-comparison[data-presentation='sheet'] .accuracy-ring {
			width: 106px;
			height: 106px;
		}
		.accuracy-comparison[data-presentation='sheet'] .accuracy-players {
			max-width: none;
		}
		.accuracy-comparison[data-presentation='sheet'] .accuracy-players > div:not(.comparison-bar) {
			font-size: 9px;
		}
	}
	.animated-accuracy strong {
		font-variant-numeric: tabular-nums;
	}
</style>
