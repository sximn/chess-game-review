<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import FieldMessage from './FieldMessage.svelte';
	import { provideFieldContext } from './field.context';

	let {
		children,
		controlId,
		label,
		description,
		error,
		layout = 'stacked',
		class: className,
		...props
	}: HTMLAttributes<HTMLDivElement> & {
		children: Snippet;
		controlId: string;
		label: string;
		description?: string;
		error?: string;
		layout?: 'stacked' | 'inline';
	} = $props();
	let descriptionId = $derived(description ? `${controlId}-description` : undefined);
	let errorId = $derived(error ? `${controlId}-error` : undefined);
	provideFieldContext({
		get controlId() {
			return controlId;
		},
		get descriptionId() {
			return descriptionId;
		},
		get errorId() {
			return errorId;
		},
		get invalid() {
			return !!error;
		}
	});
</script>

{#snippet copy()}
	<label class="field-label" for={controlId}>{label}</label>
{/snippet}
{#snippet messages()}
	{#if description}<FieldMessage id={descriptionId}>{description}</FieldMessage>{/if}
	{#if error}<FieldMessage id={errorId} variant="error">{error}</FieldMessage>{/if}
{/snippet}
<div {...props} class={['field', className]} data-layout={layout}>
	{#if layout === 'inline'}
		<div class="field-copy">{@render copy()}{@render messages()}</div>
		{@render children()}
	{:else}
		{@render copy()}{@render children()}{@render messages()}
	{/if}
</div>

<style>
	.field {
		margin-top: var(--field-margin-top, 0);
	}
	.field-label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		margin-bottom: 9px;
	}
	.field[data-layout='inline'] {
		--field-message-font-size: 10px;
		--field-message-line-height: 1.7;
		--field-message-margin: 7px 0 0;
		--field-message-mobile-font-size: 11px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--field-gap, 20px);
	}
	.field[data-layout='inline'] .field-label {
		display: inline;
		font-size: 12px;
		font-weight: 550;
		margin-bottom: 0;
	}
	@media (max-width: 760px) {
		.field-label {
			font-size: 12px;
		}
		.field[data-layout='inline'] .field-label {
			font-size: 13px;
		}
	}
	@media (min-width: 1001px) {
		.field[data-layout='inline'] {
			--field-message-font-size: 11px;
		}
		.field[data-layout='inline'] .field-label {
			font-size: 13px;
		}
	}
</style>
