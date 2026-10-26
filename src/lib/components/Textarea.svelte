<script lang="ts">
	import type { HTMLTextareaAttributes } from 'svelte/elements';
	import { getFieldContext, fieldControlAttributes } from './field.context';
	let {
		value = $bindable(''),
		ref = $bindable<HTMLTextAreaElement | null>(null),
		monospace = false,
		id,
		'aria-describedby': describedBy,
		'aria-invalid': invalid,
		class: className,
		...props
	}: Omit<HTMLTextareaAttributes, 'value'> & {
		value?: string;
		ref?: HTMLTextAreaElement | null;
		monospace?: boolean;
	} = $props();
	const field = getFieldContext();
	let control = $derived(fieldControlAttributes(field, id, describedBy, invalid));
</script>

<textarea
	{...props}
	{...control}
	bind:this={ref}
	bind:value
	class={['textarea', className]}
	class:monospace></textarea>

<style>
	.textarea {
		width: 100%;
		min-height: var(--textarea-min-height, 170px);
		resize: var(--textarea-resize, vertical);
		padding: var(--textarea-padding, 14px);
		background: var(--field);
		border: 1px solid var(--textarea-border-color, var(--line));
		border-radius: var(--textarea-radius, 10px);
		color: var(--ink);
		font-size: var(--textarea-font-size, 12px);
		line-height: 1.8;
	}
	.textarea.monospace {
		font-family: ui-monospace, monospace;
	}
	.textarea::placeholder {
		color: #a6ad98;
	}
</style>
