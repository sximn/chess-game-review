<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children, tip = false }: { children: Snippet; tip?: boolean } = $props();
</script>

<span class="mini-eyebrow" class:tip>{@render children()}</span>

<style>
	.mini-eyebrow {
		display: block;
		font-size: 7.5px;
		font-weight: 700;
		color: #959c86;
		letter-spacing: 1.5px;
	}
	@media (max-width: 760px) {
		.mini-eyebrow {
			font-size: 8px;
		}
	}
	@media (min-width: 1001px) {
		.mini-eyebrow {
			font-size: 9px;
			letter-spacing: 1.2px;
		}
	}
	@media (max-width: 760px) {
		.mini-eyebrow.tip {
			font-size: 7px;
		}
	}
</style>
