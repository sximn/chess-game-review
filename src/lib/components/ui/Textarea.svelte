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
		autocorrect?: 'on' | 'off'; // WebKit input behavior for notation fields.
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
		border-radius: var(--textarea-radius, var(--radius-md));
		color: var(--ink);
		font-size: var(--textarea-font-size, var(--text-sm));
		line-height: var(--leading-relaxed);
	}
	.textarea.monospace {
		font-family: var(--font-mono);
	}
	.textarea::placeholder {
		color: var(--text-placeholder);
		opacity: 1;
	}
</style>
