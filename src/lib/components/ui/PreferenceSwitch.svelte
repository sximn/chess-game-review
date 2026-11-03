<script lang="ts">
	import { Switch } from 'bits-ui';
	import { getFieldContext, fieldControlAttributes } from './field.context';
	let { id, checked = $bindable(false) }: { id?: string; checked?: boolean } = $props();
	const field = getFieldContext();
	let control = $derived(fieldControlAttributes(field, id));
</script>

<Switch.Root {...control} bind:checked
	>{#snippet child({ props })}<button {...props} class="switch">
			<Switch.Thumb
				>{#snippet child({ props })}<span {...props} class="switch-thumb"
					></span>{/snippet}</Switch.Thumb
			>
		</button>{/snippet}</Switch.Root
>

<style>
	.switch {
		width: 41px;
		height: 25px;
		border-radius: 20px;
		flex-shrink: 0;
		background: var(--control-bg);
		border: 1px solid var(--control-border);
		padding: 2px;
		box-shadow: var(--shadow-inset);
	}
	.switch[data-state='checked'] {
		background: var(--control-checked-bg);
		border-color: var(--control-checked-border);
	}
	.switch-thumb {
		display: block;
		width: 19px;
		height: 19px;
		border-radius: 50%;
		background: var(--control-thumb);
		box-shadow: var(--shadow-thumb);
		transition: transform 0.2s var(--ease);
	}
	.switch-thumb[data-state='checked'] {
		transform: translateX(15px);
	}
	@media (max-width: 760px) {
		.switch {
			height: 28px;
			width: 46px;
		}
		.switch-thumb {
			width: 22px;
			height: 22px;
		}
		.switch-thumb[data-state='checked'] {
			transform: translateX(17px);
		}
	}
	.switch {
		position: relative;
	}
	.switch::before {
		content: '';
		position: absolute;
		inset: -10px;
	}
</style>
