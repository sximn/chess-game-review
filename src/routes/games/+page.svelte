<script lang="ts">
	import GameLibrary from '#lib/components/games/GameLibrary.svelte';
	import { app } from '#lib/state.svelte.js';
</script>

{#if app.hydrated}<GameLibrary />{/if}
