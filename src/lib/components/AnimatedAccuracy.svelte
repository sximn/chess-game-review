<script lang="ts">
	import { onMount } from 'svelte';
	let {
		whiteName,
		blackName,
		whiteAccuracy = 94.2,
		blackAccuracy = 78.6
	}: {
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

<div class="accuracy-comparison animated-accuracy">
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
