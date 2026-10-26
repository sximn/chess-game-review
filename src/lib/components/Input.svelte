<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { getFieldContext, fieldControlAttributes } from './field.context';
	let {
		value = $bindable(''),
		ref = $bindable<HTMLInputElement | null>(null),
		type = 'text',
		variant = 'default',
		size = 'md',
		leading,
		id,
		'aria-describedby': describedBy,
		'aria-invalid': invalid,
		class: className,
		style,
		...props
	}: Omit<HTMLInputAttributes, 'value' | 'type' | 'size'> & {
		value?: string;
		ref?: HTMLInputElement | null;
		type?: 'text' | 'search' | 'email' | 'password' | 'tel' | 'url';
		variant?: 'default' | 'surface';
		size?: 'sm' | 'md' | 'lg';
		leading?: Snippet;
	} = $props();
	const field = getFieldContext();
	let control = $derived(fieldControlAttributes(field, id, describedBy, invalid));
</script>

<div
	class={['input-shell', className]}
	{style}
	data-variant={variant}
	data-size={size}
	data-disabled={props.disabled || undefined}
>
	{@render leading?.()}
	<input {...props} {...control} {type} bind:this={ref} bind:value class="input-control" />
</div>

<style>
	.input-shell {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--input-background, var(--_input-background, var(--field)));
		border: 1px solid var(--input-border-color, var(--line));
		border-radius: var(--input-radius, var(--_input-radius, 10px));
		padding: 0 var(--input-padding, var(--_input-padding, 14px));
		width: var(--input-shell-width, 100%);
		color: var(--input-icon-color, #a1aa91);
	}
	.input-shell[data-variant='surface'] {
		--_input-background: var(--paper);
	}
	.input-shell[data-size='sm'] {
		--_input-height: 36px;
		--_input-font-size: 10px;
		--_input-padding: 11px;
		--_input-radius: 9px;
	}
	.input-shell[data-size='lg'] {
		--_input-height: 47px;
		--_input-font-size: 13px;
		--_input-padding: 16px;
	}
	.input-control {
		font-size: var(--input-font-size, var(--_input-font-size, 12px));
		height: var(--input-height, var(--_input-height, 43px));
		width: var(--input-width, 100%);
		min-width: 0;
		border: 0;
		background: none;
		outline: none;
		color: var(--ink);
	}
	.input-control::placeholder {
		color: #a6ad98;
	}
	.input-shell:focus-within {
		box-shadow: var(--ring);
	}
	.input-shell[data-disabled] {
		opacity: 0.5;
	}
</style>
