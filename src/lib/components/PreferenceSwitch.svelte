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
		background: #dddccc;
		border: 1px solid #cfceb9;
		padding: 2px;
		box-shadow: inset 0 1px 3px #0001;
	}
	.switch[data-state='checked'] {
		background: #9cb885;
		border-color: #8ca775;
	}
	.switch-thumb {
		display: block;
		width: 19px;
		height: 19px;
		border-radius: 50%;
		background: linear-gradient(#fff, #f5f1e7);
		box-shadow: 0 1px 3px #0003;
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
