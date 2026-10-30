<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	let {
		children,
		variant = 'primary',
		size = 'md',
		fullWidth = false,
		ref = $bindable<HTMLButtonElement | null>(null),
		type = 'button',
		class: className,
		...props
	}: HTMLButtonAttributes & {
		children?: Snippet;
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
		size?: 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';
		fullWidth?: boolean;
		ref?: HTMLButtonElement | null;
	} = $props();
</script>

<button
	{...props}
	bind:this={ref}
	{type}
	class={['button', className]}
	data-variant={variant}
	data-size={size}
	class:full-width={fullWidth}>{@render children?.()}</button
>

<style>
	/* Public --button-* properties let the owner adjust geometry without copying skins. */
	.button {
		--_button-background: var(--paper);
		--_button-shadow: inset 0 1px #ffffff85, 0 2px 3px #42370a0a;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--button-width, auto);
		height: var(--button-height, auto);
		min-height: var(--button-min-height, var(--_button-min-height, 43px));
		padding: var(--button-padding, var(--_button-padding, 0 17px));
		gap: var(--button-gap, var(--_button-gap, 9px));
		border-radius: var(--button-radius, var(--_button-radius, 11px));
		font-size: var(--button-font-size, var(--_button-font-size, 12px));
		font-weight: var(--button-font-weight, var(--_button-font-weight, 700));
		white-space: var(--_button-white-space, nowrap);
		letter-spacing: var(--_button-letter-spacing, -0.01em);
		border: var(--button-border, 1px solid var(--line));
		background: var(--button-background, var(--_button-background));
		color: var(--button-color, var(--_button-color, inherit));
		box-shadow: var(--button-shadow, var(--_button-shadow));
	}
	.button[data-variant='primary'] {
		--_button-background: linear-gradient(180deg, var(--yellow-hi), var(--yellow));
		--_button-color: #353422;
		--_button-shadow:
			inset 0 1px #ffffffa0, inset 0 -1px #0000000c, 0 2px 3px #42370a1a, 0 4px 8px -4px #42370a38;
		border-color: var(--button-border-color, var(--yellow-lo));
	}
	.button[data-variant='secondary'] {
		--_button-background: linear-gradient(var(--field), var(--paper-deep));
	}
	.button[data-variant='outline'] {
		--_button-shadow: none;
	}
	.button[data-variant='ghost'],
	.button[data-variant='link'] {
		--_button-background: transparent;
		--_button-color: var(--muted);
		--_button-shadow: none;
		border: var(--button-border, 0);
	}
	.button[data-variant='link'] {
		--_button-min-height: 0px;
		--_button-padding: 0;
		--_button-radius: 0;
		--_button-color: #82956d;
	}
	.button[data-size='sm'] {
		--_button-min-height: 36px;
		--_button-padding: 0 11px;
		--_button-font-size: 11px;
		--_button-gap: 6px;
	}
	.button[data-size='lg'] {
		--_button-min-height: 47px;
		--_button-padding: 0 20px;
		--_button-font-size: 13px;
	}
	.button[data-size='icon'],
	.button[data-size='icon-sm'] {
		--_button-min-height: 0px;
		--_button-padding: 0;
		--_button-radius: 9px;
		font-size: var(--button-font-size, inherit);
		font-weight: var(--button-font-weight, inherit);
		--_button-letter-spacing: normal;
		--_button-white-space: normal;
		--_button-gap: normal;
		width: var(--button-width, 36px);
		height: var(--button-height, 36px);
	}
	.button[data-size='icon-sm'] {
		width: var(--button-width, 32px);
		height: var(--button-height, 32px);
	}
	.button.full-width {
		width: 100%;
	}
	@media (hover: hover) {
		.button:hover {
			background: var(
				--button-hover-background,
				var(--button-background, var(--_button-background))
			);
			color: var(--button-hover-color, var(--button-color, var(--_button-color, inherit)));
		}
		.button[data-variant='primary']:hover,
		.button[data-variant='secondary']:hover {
			filter: brightness(1.015);
			box-shadow:
				0 3px 9px #42370a17,
				inset 0 1px #fff8;
		}
		.button[data-variant='ghost']:hover,
		.button[data-variant='outline']:hover {
			background: var(--button-hover-background, var(--paper-deep));
		}
		.button[data-variant='ghost']:hover {
			color: var(--button-hover-color, #7c8b65);
		}
		.button[data-variant='link']:hover {
			text-decoration: underline;
			color: var(--button-hover-color, var(--ink));
		}
	}
	.button:active:not(:disabled) {
		box-shadow: inset 0 1px 2px #0003;
	}
</style>
