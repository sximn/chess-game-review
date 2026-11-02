<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		actions
	}: {
		title: string;
		actions?: Snippet;
	} = $props();
</script>

<div class="page-heading">
	<h1>{title}</h1>
	{@render actions?.()}
</div>

<style>
	.page-heading {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		margin-bottom: 29px;
	}
	h1 {
		font-weight: 650;
		font-size: 34px;
		line-height: 1.2;
		letter-spacing: -1.5px;
	}
	@media (min-width: 1500px) {
		.page-heading {
			margin-bottom: 33px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		h1 {
			font-size: 30px;
		}
	}
	@media (max-width: 760px) {
		.page-heading {
			margin-bottom: 24px;
			gap: 12px;
		}
		h1 {
			font-size: 30px;
		}
	}

	.page-heading > :global(.heading-action) {
		margin-top: 10px;
		--button-min-height: 40px;
		--button-font-size: 10px;
		--button-padding: 0 15px;
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.page-heading > :global(.heading-action) {
			--button-font-size: 9px;
			--button-padding: 0 10px;
		}
		.page-heading > :global(.heading-action) > :global(svg:last-child) {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.page-heading > :global(.heading-action) {
			--button-font-size: 0px;
			--button-width: 44px;
			--button-height: 44px;
			--button-min-height: 44px;
			--button-padding: 0;
			--button-radius: 11px;
			margin-top: 0;
			flex-shrink: 0;
		}
		.page-heading > :global(.heading-action) > :global(svg ~ svg:last-child) {
			display: none;
		}
		.page-heading > :global(.heading-action) > :global(svg:first-child) {
			width: 16px;
		}
	}
</style>
