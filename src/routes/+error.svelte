<svelte:options runes={true} />

<script lang="ts">
	import { page } from '$app/state';
</script>

<!-- Preserve the framework fallback markup and the former global title styling. -->
<h1 class:review-error={page.url.pathname === '/'}>{page.status}</h1>
<p>{page.error?.message}</p>

<style>
	h1 {
		font-weight: var(--weight-semibold);
		font-size: var(--text-page);
		line-height: var(--leading-tight);
		letter-spacing: var(--tracking-heading);
	}
	@media (max-width: 1000px) {
		h1 {
			font-size: var(--text-heading);
		}
	}
	h1.review-error {
		font-size: var(--text-title);
		letter-spacing: var(--tracking-heading);
	}
	@media (max-width: 760px) {
		h1.review-error {
			font-size: var(--text-title);
		}
	}
	@media (max-height: 520px) and (min-width: 480px) {
		h1.review-error {
			font-size: var(--text-xl);
		}
	}
</style>
