<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		review = false,
		actions
	}: {
		title: string;
		description?: string;
		review?: boolean;
		actions?: Snippet;
	} = $props();
</script>

<div class="page-heading" class:review-heading={review}>
	{#if review}<h1>{title}<span class="heading-dot">.</span></h1>{:else}
		<div>
			<h1>{title}<span class="heading-dot">.</span></h1>
			{#if description}<p>{description}</p>{/if}
		</div>
	{/if}
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
	.heading-dot {
		color: #b8c39a;
	}
	.page-heading p {
		font-size: 11.5px;
		margin-top: 9px;
		color: var(--muted);
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
		.page-heading p {
			font-size: 10px;
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
		.page-heading p {
			font-size: 10px;
			line-height: 1.8;
			margin-top: 7px;
		}
	}
	@media (min-width: 1001px) {
		.page-heading p {
			font-size: 13px;
		}
	}
	.page-heading.review-heading {
		flex: 0 0 36px;
		height: 36px;
		min-height: 36px;
		margin: 0 0 12px;
		gap: 12px;
	}
	.review-heading h1 {
		font-size: 25px;
		letter-spacing: -0.9px;
	}
	@media (max-width: 760px) {
		.page-heading.review-heading {
			flex-basis: 36px;
			height: 36px;
			min-height: 36px;
			margin-bottom: 8px;
		}
		.review-heading h1 {
			font-size: 24px;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.page-heading.review-heading {
			flex-basis: 28px;
			height: 28px;
			min-height: 28px;
			margin-bottom: 6px;
		}
		.review-heading h1 {
			font-size: 20px;
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
