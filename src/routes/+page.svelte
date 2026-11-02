<script lang="ts">
	import { page } from '$app/state';
	import { app } from '#lib/state.svelte.js';
	import GameReview from '#lib/components/replay/GameReview.svelte';
	import GameLibrary from '#lib/components/games/GameLibrary.svelte';

	let requestedId = $derived(page.url.searchParams.get('game'));
	let game = $derived(app.games.find((game) => game.id === requestedId));
</script>

{#if app.hydrated}
	{#if game}
		<GameReview {game} />
	{:else}
		<GameLibrary missingGame={!!requestedId} />
	{/if}
{/if}
