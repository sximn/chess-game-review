<script lang="ts">
	import { onMount } from 'svelte';
	import { Capacitor } from '@capacitor/core';
	import '@fontsource-variable/dm-sans';
	import '@fontsource/dm-serif-display';
	import '#lib/styles.css';
	import { initializeBreakpoints } from '#lib/breakpoints.js';
	import AppShell from '#lib/components/AppShell.svelte';

	let { children } = $props();

	onMount(() => {
		if (!import.meta.env.DEV && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator)
			void navigator.serviceWorker.register('/service-worker.js').catch(() => {
				/* Engine still works; offline installation can be retried on reload. */
			});
	});
	initializeBreakpoints();
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
	@media (max-width: 600px) {
		.skip-link {
			left: 8px;
		}
	}
</style>
