<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	let {
		open = $bindable(false),
		title,
		description,
		closeLabel,
		kind = 'help',
		symbol,
		children
	}: {
		open?: boolean;
		title: string;
		description: string;
		closeLabel: string;
		kind?: 'help' | 'import';
		symbol: Snippet;
		children: Snippet;
	} = $props();
</script>

<Dialog.Root bind:open
	><Dialog.Portal>
		<Dialog.Overlay
			>{#snippet child({ props })}<div
					{...props}
					class="dialog-overlay"
				></div>{/snippet}</Dialog.Overlay
		>
		<Dialog.Content
			>{#snippet child({ props })}<div
					{...props}
					class="dialog-content"
					class:import-dialog={kind === 'import'}
				>
					{#if kind === 'import'}<div class="dialog-handle"></div>{/if}
					<div class="dialog-top">
						<span class="dialog-symbol">{@render symbol()}</span>
						<Dialog.Close aria-label={closeLabel}
							>{#snippet child({ props })}<button {...props} class="icon-button"
									><X size={20} /></button
								>{/snippet}</Dialog.Close
						>
					</div>
					<Dialog.Title
						>{#snippet child({ props })}<div {...props} class="dialog-title">
								{title}
							</div>{/snippet}</Dialog.Title
					>
					<Dialog.Description
						>{#snippet child({ props })}<div {...props} class="dialog-description">
								{description}
							</div>{/snippet}</Dialog.Description
					>
					{@render children()}
				</div>{/snippet}</Dialog.Content
		>
	</Dialog.Portal></Dialog.Root
>

<style>
	.dialog-overlay {
		position: fixed;
		inset: 0;
		background: #252b2059;
		backdrop-filter: blur(6px);
		z-index: 60;
		animation: fade-in 0.2s;
	}
	.dialog-content {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: 61;
		width: min(460px, calc(100vw - 40px));
		max-height: calc(100dvh - 48px);
		overflow: auto;
		background: var(--paper);
		border: 1px solid var(--line);
		padding: 28px;
		border-radius: 22px;
		box-shadow: 0 15px 70px #27321e33;
		animation: dialog-in 0.25s var(--ease);
	}
	.dialog-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 19px;
	}
	.dialog-symbol {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		background: var(--paper-deep);
		border-radius: 13px;
		color: #89966e;
		border: 1px solid var(--line);
	}
	.dialog-title {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 29px;
		letter-spacing: -0.7px;
		line-height: 1.2;
	}
	.dialog-description {
		font-size: 12px;
		line-height: 1.8;
		color: var(--muted);
		margin: 12px 0 24px;
	}
	.dialog-handle {
		display: none;
	}
	@media (max-width: 760px) {
		.dialog-content {
			top: auto;
			bottom: 0;
			left: 0;
			transform: none;
			width: 100%;
			max-height: calc(100dvh - env(safe-area-inset-top, 0px) - 15px);
			padding: 12px max(24px, env(safe-area-inset-right, 0px))
				calc(27px + env(safe-area-inset-bottom, 0px)) max(24px, env(safe-area-inset-left, 0px));
			border-radius: 24px 24px 0 0;
			animation: sheet-in 0.3s var(--ease);
		}
		.dialog-handle {
			display: block;
			height: 4px;
			width: 35px;
			border-radius: 10px;
			background: #d5dac6;
			margin: 0 auto 21px;
		}
		.dialog-top {
			margin-bottom: 17px;
		}
		.dialog-title {
			font-size: 30px;
		}
		.dialog-description {
			font-size: 12px;
		}
		:global(.keyboard-open) .dialog-content {
			max-height: calc(100dvh - 15px);
		}
	}
	.icon-button {
		width: 36px;
		height: 36px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border-radius: 9px;
		color: var(--muted);
	}
	@media (hover: hover) {
		.icon-button:hover {
			background: var(--paper-deep);
			color: #7c8b65;
		}
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes dialog-in {
		from {
			opacity: 0;
			transform: translate(-50%, -47%) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
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
