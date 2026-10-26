<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	let {
		children,
		variant = 'primary',
		presentation = 'default',
		review = false,
		class: className = '',
		...props
	}: HTMLButtonAttributes & {
		children: Snippet;
		variant?: 'primary' | 'secondary';
		presentation?: 'default' | 'heading' | 'sidebar' | 'welcome' | 'import';
		review?: boolean;
	} = $props();
</script>

<button
	{...props}
	class={`button ${variant} ${presentation === 'import' ? 'full' : ''} ${presentation === 'sidebar' ? 'sidebar-import' : ''} ${className}`}
	data-presentation={presentation}
	class:review>{@render children()}</button
>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 9px;
		min-height: 43px;
		padding: 0 17px;
		border-radius: 11px;
		font-size: 12px;
		font-weight: 700;
		white-space: nowrap;
		letter-spacing: -0.01em;
		box-shadow:
			inset 0 1px #ffffff85,
			0 2px 3px #42370a0a;
		border: 1px solid var(--line);
		background: var(--paper);
	}
	.button.primary {
		color: #353422;
		background: linear-gradient(180deg, var(--yellow-hi), var(--yellow));
		border-color: var(--yellow-lo);
		box-shadow:
			inset 0 1px #ffffffa0,
			inset 0 -1px #0000000c,
			0 2px 3px #42370a1a,
			0 4px 8px -4px #42370a38;
	}
	.button.secondary {
		background: linear-gradient(var(--field), var(--paper-deep));
	}
	.button.full {
		width: 100%;
	}
	@media (hover: hover) {
		.button:hover {
			transform: translateY(-1px);
			filter: brightness(1.015);
			box-shadow:
				0 3px 9px #42370a17,
				inset 0 1px #fff8;
		}
	}
	.button[data-presentation='sidebar'] {
		margin: 24px 5px 0;
		min-height: 42px;
		gap: 8px;
	}
	.button[data-presentation='heading'] {
		margin-top: 10px;
		min-height: 40px;
		font-size: 10px;
		padding: 0 15px;
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.button[data-presentation='sidebar'] {
			padding: 0 10px;
			font-size: 10px;
			margin-left: 0;
			margin-right: 0;
		}
		.button[data-presentation='heading'] {
			font-size: 9px;
			padding: 0 10px;
		}
		.button[data-presentation='heading'] > :global(svg:last-child) {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.button[data-presentation='heading'] {
			font-size: 0;
			width: 44px;
			height: 44px;
			min-height: 44px;
			padding: 0;
			border-radius: 11px;
			margin-top: 0;
			flex-shrink: 0;
		}
		.button[data-presentation='heading'] > :global(svg:last-child) {
			display: none;
		}
		.button[data-presentation='heading'] > :global(svg:first-child) {
			width: 16px;
		}
	}
	.button[data-presentation='welcome'] {
		font-size: 10px;
		min-height: 39px;
	}
	@media (max-width: 760px) {
		.button[data-presentation='welcome'] {
			font-size: 9px;
		}
	}
	.button[data-presentation='import'] {
		margin-top: 22px;
	}
	@media (max-width: 760px) {
		.button[data-presentation='import'] {
			min-height: 47px;
			font-size: 13px;
		}
	}
	@media (max-height: 520px) and (min-width: 761px) {
		.button[data-presentation='sidebar'].review {
			font-size: 0;
			min-width: 0;
			width: 40px;
			padding: 0;
			gap: 0;
			margin: 14px 0 0;
		}
		.button[data-presentation='sidebar'].review > :global(svg) {
			width: 18px;
		}
	}
	.button:active:not(:disabled) {
		transform: translateY(1px);
	}
</style>
