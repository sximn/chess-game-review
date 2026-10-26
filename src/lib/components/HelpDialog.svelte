<script lang="ts">
	import { CircleQuestionMark } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
	import DialogFrame from './DialogFrame.svelte';
</script>

<DialogFrame
	bind:open={app.helpOpen}
	title="Make yourself at home."
	description="A few small things to help you find your way."
	closeLabel="Close help"
>
	{#snippet symbol()}<CircleQuestionMark size={24} />{/snippet}
	<div class="help-item">
		<span>← →</span>
		<p>
			<strong>One move at a time</strong>Use your arrow keys or the controls below the board.
		</p>
	</div>
	<div class="help-item">
		<span>Space</span>
		<p><strong>Sit back and watch</strong>Play or pause the game automatically.</p>
	</div>
	<div class="help-item">
		<span>PGN</span>
		<p>
			<strong>Bring your own game</strong>Paste notation or upload a .pgn file. Games are saved on
			this device.
		</p>
	</div>
	<p class="sample-notice">
		The Opera Game includes illustrative review data. Imported games support replay; engine analysis
		is a future addition.
	</p>
</DialogFrame>

<style>
	.sample-notice {
		font-size: 10px;
		line-height: 1.8;
		padding: 12px;
		border-radius: 9px;
		background: var(--bg);
		color: var(--muted);
		margin-top: 20px;
	}
	@media (max-width: 760px) {
		.sample-notice {
			font-size: 11px;
		}
	}
	.help-item {
		display: flex;
		gap: 18px;
		align-items: center;
		margin: 20px 0;
	}
	.help-item > span {
		width: 55px;
		flex-shrink: 0;
		background: var(--paper-deep);
		border: 1px solid var(--line);
		border-bottom-width: 3px;
		border-radius: 8px;
		padding: 9px;
		text-align: center;
		font-size: 11px;
		color: #8b9677;
	}
	.help-item p {
		font-size: 11px;
		line-height: 1.8;
		color: var(--muted);
	}
	.help-item strong {
		display: block;
		color: var(--ink);
		font-weight: 600;
	}
</style>
