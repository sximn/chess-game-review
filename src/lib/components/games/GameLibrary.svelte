<script lang="ts">
	import { Plus, Search } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
	import { parseGame } from '#lib/chess.js';
	import Button from '#lib/components/ui/Button.svelte';
	import Input from '#lib/components/ui/Input.svelte';
	import LibraryGameCard from './LibraryGameCard.svelte';
	import WelcomeBoard from './WelcomeBoard.svelte';

	let { missingGame = false }: { missingGame?: boolean } = $props();
	let query = $state('');
	let games = $derived(
		[...app.games]
			.reverse()
			.map((game) => ({ ...game, ...parseGame(game.pgn) }))
			.filter((game) =>
				`${game.headers.White} ${game.headers.Black} ${game.headers.Event}`
					.toLowerCase()
					.includes(query.trim().toLowerCase())
			)
	);
</script>

<svelte:head><title>My games · Up a Pawn</title></svelte:head>

{#if missingGame}
	<p class="missing-game" role="status">This game isn’t saved on this device.</p>
{/if}

{#if app.games.length === 0}
	<section class="welcome" aria-labelledby="welcome-title">
		<WelcomeBoard />
		<div class="welcome-copy">
			<h1 id="welcome-title">Your next move starts here.</h1>
			<p>Import your game. Review the moves.</p>
			<Button size="lg" class="welcome-import" onclick={() => (app.importOpen = true)}>
				<Plus size={20} /> Import your game
			</Button>
		</div>
	</section>
{:else}
	<div class="library">
		<section class="import-area" aria-labelledby="import-title">
			<div>
				<h1 id="import-title">Take another look.</h1>
				<p>Paste a PGN or upload a game.</p>
			</div>
			<Button size="lg" onclick={() => (app.importOpen = true)}>
				<Plus size={19} /> Import your game
			</Button>
		</section>
		<section aria-labelledby="games-title">
			<div class="library-heading">
				<h2 id="games-title">My games <span>{app.games.length}</span></h2>
				{#if app.games.length > 5}
					<Input
						variant="surface"
						size="sm"
						aria-label="Search games"
						bind:value={query}
						placeholder="Find a player or game"
					>
						{#snippet leading()}<Search size={17} />{/snippet}
					</Input>
				{/if}
			</div>
			<div class="game-library">
				{#each games as game (game.id)}<LibraryGameCard {game} />{/each}
			</div>
			{#if games.length === 0}
				<div class="empty-search" role="status">
					<p>No games found.</p>
					<Button variant="link" onclick={() => (query = '')}>Clear search</Button>
				</div>
			{/if}
		</section>
	</div>
{/if}

<style>
	.welcome {
		min-height: min(650px, calc(100dvh - 170px));
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 35px;
		padding: 36px 0;
		text-align: center;
	}
	h1 {
		font-family: var(--font-display);
		font-weight: var(--weight-regular);
	}
	.welcome h1 {
		font-size: var(--text-display);
		line-height: var(--leading-display);
	}
	p {
		color: var(--muted);
		font-size: var(--text-md);
		line-height: var(--leading-body);
	}
	.welcome p {
		margin-top: 12px;
	}
	.welcome-copy :global(.welcome-import) {
		margin-top: 27px;
		--button-min-height: 52px;
		--button-padding: 0 28px;
		--button-font-size: var(--text-lg);
	}
	.library {
		padding: 20px 0;
	}
	.import-area {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		padding: 28px 30px;
		border: 1px solid var(--line);
		border-radius: var(--radius-lg);
		background: var(--paper);
	}
	.import-area h1 {
		font-size: var(--text-heading);
		margin-bottom: 5px;
	}
	.import-area p {
		font-size: var(--text-md);
	}
	.library-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 18px;
		margin: 36px 0 16px;
	}
	.library-heading h2 {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
	}
	.library-heading h2 span {
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--muted);
		background: var(--paper-deep);
		padding: 3px 8px;
		border-radius: var(--radius-xs);
	}
	.game-library {
		display: grid;
		gap: 10px;
	}
	.library-heading :global(.input-shell) {
		max-width: 260px;
		--input-font-size: var(--text-md);
	}
	.empty-search {
		text-align: center;
		padding: 36px 0;
	}
	.empty-search p {
		margin-bottom: 14px;
	}
	.missing-game {
		padding: 12px 16px;
		background: var(--paper-deep);
		border-radius: var(--radius-sm);
	}
	@media (max-width: 760px) {
		.welcome {
			min-height: calc(100dvh - 245px);
			gap: 28px;
			padding: 20px 0;
		}
		.welcome h1 {
			max-width: 320px;
			margin: auto;
		}
		.library {
			padding: 0;
		}
		.import-area {
			flex-direction: column;
			align-items: stretch;
			gap: 20px;
			padding: 24px;
		}
		.library-heading {
			flex-wrap: wrap;
			margin-top: 28px;
		}
		.library-heading :global(.input-shell) {
			width: 100%;
			max-width: none;
			--input-font-size: var(--text-input-mobile);
		}
	}
	@media (max-width: 760px) and (max-height: 700px) {
		.welcome {
			gap: 20px;
			padding: 10px 0;
		}
		.welcome h1 {
			font-size: var(--text-heading);
		}
		.welcome-copy :global(.welcome-import) {
			margin-top: 20px;
			--button-min-height: 48px;
		}
	}
</style>
