<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	let {
		children,
		variant = 'hint',
		role,
		class: className,
		...props
	}: HTMLAttributes<HTMLParagraphElement> & {
		children: Snippet;
		variant?: 'hint' | 'error';
	} = $props();
</script>

<p
	{...props}
	role={role === undefined ? (variant === 'error' ? 'alert' : undefined) : role}
	class={['field-message', className]}
	data-variant={variant}
>
	{@render children()}
</p>

<style>
	.field-message {
		font-size: var(--field-message-font-size, var(--text-caption));
		line-height: var(--field-message-line-height, var(--leading-relaxed));
		color: var(--muted);
		margin: var(--field-message-margin, 9px 0 0);
	}
	.field-message[data-variant='error'] {
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		padding: 12px;
		border: 1px solid var(--error-border);
		background: var(--error-bg);
		color: var(--error-text);
		border-radius: var(--radius-sm);
		margin: 14px 0 0;
	}
	@media (max-width: 760px) {
		.field-message[data-variant='hint'] {
			font-size: var(--field-message-mobile-font-size, var(--text-caption));
		}
	}
</style>
