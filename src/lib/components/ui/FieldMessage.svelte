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
		font-size: var(--field-message-font-size, 9px);
		line-height: var(--field-message-line-height, 1.8);
		color: var(--muted);
		margin: var(--field-message-margin, 9px 0 0);
	}
	.field-message[data-variant='error'] {
		font-size: 11px;
		line-height: 1.7;
		padding: 12px;
		border: 1px solid #e3bbb0;
		background: #fff0e7;
		color: #a1543f;
		border-radius: 9px;
		margin: 14px 0 0;
	}
	@media (max-width: 760px) {
		.field-message[data-variant='hint'] {
			font-size: var(--field-message-mobile-font-size, 10px);
		}
	}
</style>
