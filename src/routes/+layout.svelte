<script lang="ts">
	import '@fontsource-variable/dm-sans';
	import '@fontsource/dm-serif-display';
	import '#lib/styles.css';
	import AppShell from '#lib/components/AppShell.svelte';
	let { children } = $props();
</script>

<a href="#main-content" class="skip-link">Skip to content</a>
<AppShell>{@render children()}</AppShell>

<style>
	.skip-link {
		position: fixed;
		top: 8px;
		left: 260px;
		background: var(--yellow);
		color: #2c302b;
		padding: 12px 20px;
		border-radius: 10px;
		z-index: 100;
		transform: translateY(-150%);
	}
	.skip-link:focus {
		transform: none;
	}
</style>
