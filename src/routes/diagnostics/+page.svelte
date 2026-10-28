<script lang="ts">
	import { onDestroy } from 'svelte';
	import { runDiagnostics } from '#lib/engine/diagnostics.js';
	import { BUILD } from '#lib/engine/build.js';
	let running = $state(false),
		status = $state('Ready'),
		output = $state('');
	let abort: AbortController | undefined;
	async function run() {
		if (running) return;
		running = true;
		output = '';
		abort = new AbortController();
		try {
			const result = await runDiagnostics(100, (message) => (status = message), abort.signal);
			output = JSON.stringify(result, null, 2);
			status = 'All local checks passed';
		} catch (error) {
			status = (error as Error).message;
		} finally {
			running = false;
		}
	}
	onDestroy(() => abort?.abort());
</script>

<svelte:head><title>Engine diagnostics · Up a Pawn</title></svelte:head>
<section class="diagnostics">
	<h1>Local engine diagnostics</h1>
	<p>Frozenight · scalar WebAssembly · one worker · no shared memory</p>
	<p>
		Runs 100 initialization, search, cancellation, reset and disposal cycles on this device. No
		games or results are sent anywhere.
	</p>
	<button onclick={run} disabled={running}>Run local diagnostics</button>
	<p role="status">{status}</p>
	<details>
		<summary>Engine build and network</summary>
		<pre>{JSON.stringify(BUILD, null, 2)}</pre>
	</details>
	{#if output}<pre data-testid="diagnostics-results">{output}</pre>{/if}
	<a href="/">Return to review</a>
</section>

<style>
	.diagnostics {
		background: var(--paper);
		border: 1px solid var(--line);
		padding: 24px;
		border-radius: 14px;
		overflow: auto;
		min-height: 0;
	}
	.diagnostics h1 {
		font-size: 24px;
		margin-bottom: 12px;
	}
	.diagnostics p {
		font-size: 13px;
		line-height: 1.7;
		margin: 10px 0;
		color: var(--muted);
	}
	button {
		background: var(--yellow);
		border-radius: 8px;
		padding: 12px 16px;
		margin: 12px 0;
		min-height: 44px;
	}
	pre {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font-size: 11px;
		line-height: 1.5;
		margin: 16px 0;
	}
	a {
		text-decoration: underline;
		font-size: 13px;
	}
</style>
