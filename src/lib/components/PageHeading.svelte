<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		title,
		eyebrow,
		description,
		review = false,
		actions
	}: {
		title: string;
		eyebrow?: string;
		description?: string;
		review?: boolean;
		actions?: Snippet;
	} = $props();
</script>

<div class="page-heading" class:review-heading={review}>
	{#if review}<h1>{title}<span class="heading-dot">.</span></h1>{:else}
		<div>
			{#if eyebrow}<div class="eyebrow"><span></span> {eyebrow}</div>{/if}
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
	.eyebrow {
		font-size: 8px;
		letter-spacing: 1.7px;
		font-weight: 700;
		color: #8c947b;
		display: flex;
		align-items: center;
		gap: 7px;
		margin-bottom: 10px;
	}
	.eyebrow > span {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #9aaa84;
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
		.eyebrow {
			font-size: 7px;
			letter-spacing: 1.1px;
		}
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
		.eyebrow {
			font-size: 6.5px;
			letter-spacing: 1.25px;
			margin-bottom: 10px;
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
	@media (max-width: 360px) {
		.eyebrow {
			font-size: 5.5px;
			letter-spacing: 1px;
		}
	}
	@media (min-width: 1001px) {
		.page-heading p {
			font-size: 13px;
		}
		.eyebrow {
			font-size: 9px;
			letter-spacing: 1.3px;
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
</style>
