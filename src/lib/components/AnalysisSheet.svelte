<script lang="ts">
	import Button from './Button.svelte';
	import { Dialog } from 'bits-ui';
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	let {
		open = $bindable(false),
		description,
		children
	}: { open?: boolean; description: string; children: Snippet } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			>{#snippet child({ props })}<div
					{...props}
					class="analysis-overlay"
				></div>{/snippet}</Dialog.Overlay
		>
		<Dialog.Content>
			{#snippet child({ props })}
				<div {...props} class="analysis-sheet">
					<div class="sheet-handle"></div>
					<div class="analysis-sheet-heading">
						<Dialog.Title
							>{#snippet child({ props })}<div {...props}>
									Game analysis
								</div>{/snippet}</Dialog.Title
						>
						<Dialog.Close aria-label="Close analysis"
							>{#snippet child({ props })}<Button
									{...props}
									variant="ghost"
									size="icon"
									class="close-analysis"><X size={21} /></Button
								>{/snippet}</Dialog.Close
						>
					</div>
					<Dialog.Description
						>{#snippet child({ props })}<div {...props} class="sheet-description">
								{description}
							</div>{/snippet}</Dialog.Description
					>
					<div class="analysis-sheet-scroll">{@render children()}</div>
				</div>
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.analysis-overlay {
		position: fixed;
		inset: 0;
		background: #252b2059;
		backdrop-filter: blur(6px);
		z-index: 60;
		animation: overlay-in 0.2s;
	}
	.analysis-sheet {
		position: fixed;
		z-index: 61;
		left: 50%;
		bottom: 0;
		translate: -50% 0;
		width: min(640px, 100%);
		height: min(88dvh, 760px);
		max-height: calc(100dvh - env(safe-area-inset-top, 0px) - 12px);
		padding: 12px max(20px, env(safe-area-inset-right, 0px))
			calc(16px + env(safe-area-inset-bottom, 0px)) max(20px, env(safe-area-inset-left, 0px));
		display: flex;
		flex-direction: column;
		background: var(--bg);
		color: var(--ink);
		border: 1px solid var(--line);
		border-radius: 24px 24px 0 0;
		box-shadow: 0 -12px 70px #27321e26;
		animation: sheet-in 0.3s var(--ease);
	}
	.sheet-handle {
		display: block;
		width: 36px;
		height: 4px;
		border-radius: 10px;
		background: var(--line);
		margin: 0 auto 12px;
		flex-shrink: 0;
	}
	.analysis-sheet-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 38px;
		flex-shrink: 0;
		margin-bottom: 12px;
	}
	.analysis-sheet-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 0 2px 2px;
		scrollbar-width: thin;
		scrollbar-color: #c2c9b4 transparent;
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.analysis-sheet {
			height: calc(100dvh - 12px);
			padding-top: 8px;
		}
		.sheet-handle {
			margin-bottom: 3px;
		}
		.analysis-sheet-heading {
			margin-bottom: 7px;
			min-height: 30px;
		}
	}
	.sheet-description {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}
	@keyframes overlay-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes sheet-in {
		from {
			opacity: 0;
			transform: translateY(40px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
