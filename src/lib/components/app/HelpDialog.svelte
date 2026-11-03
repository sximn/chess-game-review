<script lang="ts">
	import { CircleQuestionMark } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
	import DialogFrame from '#lib/components/ui/DialogFrame.svelte';
</script>

<DialogFrame
	bind:open={app.helpOpen}
	title="Help"
	description="A few things to help you find your way"
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
		Frozenight reviews games on this device. Move labels are engine estimates, and key moments
		receive deeper analysis. Once installed, the app and engine can be used offline.
	</p>
</DialogFrame>

<style>
	.sample-notice {
		font-size: var(--text-caption);
		line-height: var(--leading-relaxed);
		padding: 12px;
		border-radius: var(--radius-sm);
		background: var(--bg);
		color: var(--muted);
		margin-top: 20px;
	}
	@media (max-width: 760px) {
		.sample-notice {
			font-size: var(--text-sm);
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
		border-radius: var(--radius-sm);
		padding: 9px;
		text-align: center;
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.help-item p {
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		color: var(--muted);
	}
	.help-item strong {
		display: block;
		color: var(--ink);
		font-weight: var(--weight-semibold);
	}
</style>
