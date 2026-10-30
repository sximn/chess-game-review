<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	let {
		children,
		as = 'div',
		variant = 'paper',
		shadow = false,
		interactive = false,
		clip = false,
		href,
		class: className,
		...props
	}: HTMLAttributes<HTMLElement> &
		Pick<HTMLAnchorAttributes, 'href' | 'target' | 'rel' | 'download'> & {
			children: Snippet;
			as?: 'div' | 'section' | 'article' | 'a';
			variant?: 'paper' | 'soft';
			shadow?: boolean;
			interactive?: boolean;
			clip?: boolean;
		} = $props();
</script>

<svelte:element
	this={as}
	{...props}
	href={as === 'a' ? href : undefined}
	class={['card', className]}
	data-variant={variant}
	class:shadow
	class:interactive
	class:clip>{@render children()}</svelte:element
>

<style>
	.card {
		--_card-background: var(--paper);
		--_card-shadow: none;
		--_card-overflow: visible;
		display: block;
		background: var(--card-background, var(--_card-background));
		border: var(--card-border, 1px solid var(--line));
		border-radius: var(--card-radius, 14px);
		padding: var(--card-padding, 0);
		box-shadow: var(--card-shadow, var(--_card-shadow, none));
		overflow: var(--card-overflow, var(--_card-overflow, visible));
	}
	.card[data-variant='soft'] {
		--_card-background: var(--surface-green);
	}
	.card.shadow {
		--_card-shadow: var(--shadow);
	}
	.card.clip {
		--_card-overflow: hidden;
	}
	.card.interactive {
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}
	@media (hover: hover) {
		.card.interactive:hover {
			transform: translateY(var(--card-hover-lift, -3px));
			box-shadow: var(--card-hover-shadow, 0 8px 20px #424d2410);
		}
	}
</style>
