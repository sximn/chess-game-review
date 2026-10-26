<svelte:options runes={true} />

<script lang="ts">
	import { page } from '$app/state';
</script>

<!-- Preserve the framework fallback markup and the former global title styling. -->
<h1 class:review-error={page.url.pathname === '/'}>{page.status}</h1>
<p>{page.error?.message}</p>

<style>
	h1 {
		font-weight: 650;
		font-size: 34px;
		line-height: 1.2;
		letter-spacing: -1.5px;
	}
	@media (max-width: 1000px) {
		h1 {
			font-size: 30px;
		}
	}
	h1.review-error {
		font-size: 25px;
		letter-spacing: -0.9px;
	}
	@media (max-width: 760px) {
		h1.review-error {
			font-size: 24px;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) {
		h1.review-error {
			font-size: 20px;
		}
	}
</style>
