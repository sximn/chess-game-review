<script lang="ts">
	import '@fontsource-variable/dm-sans';
	import '@fontsource/dm-serif-display';
	import '$lib/styles.css';
	import AppShell from '$lib/components/AppShell.svelte';
	let { children } = $props();
</script>

<a href="#main-content" class="skip-link">Skip to content</a>
<AppShell>{@render children()}</AppShell>
