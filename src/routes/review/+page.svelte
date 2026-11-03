<script lang="ts">
	import { page } from '$app/state';
	import { Plus } from 'lucide-svelte';
	import { app, currentReviewGame } from '#lib/state.svelte.js';
	import GameReview from '#lib/components/replay/GameReview.svelte';
	import Button from '#lib/components/ui/Button.svelte';

	let requestedId = $derived(page.url.searchParams.get('game'));
	let game = $derived(currentReviewGame(requestedId));
</script>

<svelte:head><title>Game review · Up a Pawn</title></svelte:head>

{#if app.hydrated}
	{#if game}
		<GameReview {game} />
	{:else}
		<section class="empty-review" aria-labelledby="review-title">
			{#if requestedId}<p role="status">This game isn’t saved on this device.</p>{/if}
			<h1 id="review-title">Import your game.</h1>
			<Button size="lg" onclick={() => (app.importOpen = true)}>
				<Plus size={20} /> Import your game
			</Button>
		</section>
	{/if}
{/if}

<style>
	.empty-review {
		min-height: min(650px, calc(100dvh - 170px));
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 28px;
		text-align: center;
		padding: 32px 0;
	}
	h1 {
		font-family: var(--font-display);
		font-size: var(--text-display);
		font-weight: var(--weight-regular);
		line-height: var(--leading-display);
	}
	p {
		color: var(--muted);
		font-size: var(--text-md);
	}
	.empty-review :global(.button) {
		--button-min-height: 52px;
		--button-font-size: var(--text-lg);
		--button-padding: 0 28px;
	}
	@media (max-width: 760px) {
		.empty-review {
			min-height: calc(100dvh - 245px);
		}
	}
</style>
