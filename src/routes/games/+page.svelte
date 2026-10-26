<script lang="ts">
	import Card from '#lib/components/Card.svelte';
	import Input from '#lib/components/Input.svelte';
	import LibraryGameCard from '#lib/components/LibraryGameCard.svelte';
	import PageHeading from '#lib/components/PageHeading.svelte';
	import Button from '#lib/components/Button.svelte';
	import MiniEyebrow from '#lib/components/MiniEyebrow.svelte';
	import { ArrowUpRight, ChevronRight, Plus, Search } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
	import { parseGame } from '#lib/chess.js';
	import AppLogo from '#lib/components/AppLogo.svelte';
	import { useBreakpoints } from '#lib/breakpoints.js';

	const { mobile } = useBreakpoints();

	let query = $state('');
	let filter = $state('all');
	let games = $derived(
		app.games
			.map((game) => ({ ...game, ...parseGame(game.pgn) }))
			.filter((game) => {
				const matchesQuery = `${game.headers.White} ${game.headers.Black} ${game.headers.Event}`
					.toLowerCase()
					.includes(query.toLowerCase());
				return (
					matchesQuery &&
					(filter === 'all' || (filter === 'imported' ? game.id !== 'opera' : game.id === 'opera'))
				);
			})
	);
</script>

<svelte:head><title>My games · Up a Pawn</title></svelte:head>

<PageHeading title="My games">
	{#snippet actions()}
		<Button
			size={mobile.current ? 'icon' : 'lg'}
			class="heading-action"
			onclick={() => (app.importOpen = true)}
		>
			<Plus size={18} />
			Import game
		</Button>
	{/snippet}
</PageHeading>

<Card as="section" class="library-welcome" shadow clip style="--card-radius:18px"
	><div class="welcome-content">
		<div>
			<MiniEyebrow>YOUR NEXT CHAPTER</MiniEyebrow>
			<h2>Good games.<br /><em>Better lessons.</em></h2>
			<p>That game you can’t stop thinking about?<br />Bring it here. Let’s take another look.</p>
			<Button variant="secondary" class="welcome-action" onclick={() => (app.importOpen = true)}
				>Bring a game along <ArrowUpRight size={16} /></Button
			>
		</div>
		<div class="library-art" aria-hidden="true">
			<span class="art-check a"></span><span class="art-check b"></span><span class="art-check c"
			></span><span class="art-check d"></span><AppLogo size={164} /><span class="art-star">✧</span
			><span class="art-star small">✦</span>
		</div>
	</div></Card
>
<div class="library-toolbar">
	<div class="filter-pills" aria-label="Filter games">
		{#each [{ value: 'all', label: 'All games' }, { value: 'imported', label: 'Imported' }, { value: 'sample', label: 'Classics' }] as item}<button
				class:active={filter === item.value}
				aria-pressed={filter === item.value}
				onclick={() => (filter = item.value)}
				>{item.label}{#if item.value === 'all'}<span>{app.games.length}</span>{/if}</button
			>{/each}
	</div>
	<Input
		variant="surface"
		size="sm"
		class="search-field"
		aria-label="Search games"
		bind:value={query}
		placeholder="Find a player or game…"
	>
		{#snippet leading()}<Search size={17} />{/snippet}
	</Input>
</div>
<div class="game-library">
	{#each games as game}<LibraryGameCard {game} />{/each}<button
		class="import-game-card"
		onclick={() => (app.importOpen = true)}
		><span><Plus size={28} /></span><strong>A little room for your game.</strong>
		<p>Import a PGN and start a new review.</p>
		<span class="text-link">Add a game {@render ArrowRightIcon()}</span></button
	>
</div>
{#if games.length === 0}<div class="empty-search">
		<Search size={24} />
		<h3>No games found.</h3>
		<p>Try a different name or another filter.</p>
		<Button
			variant="secondary"
			onclick={() => {
				query = '';
				filter = 'all';
			}}>Show all games</Button
		>
	</div>{/if}
{#snippet ArrowRightIcon()}<ChevronRight size={16} />{/snippet}

<style>
	.welcome-content {
		padding: 35px 40px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.welcome-content h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 43px;
		line-height: 1.12;
		margin-top: 14px;
		letter-spacing: -1px;
	}
	.welcome-content h2 em {
		color: #91a37c;
		font-weight: 400;
	}
	.welcome-content p {
		font-size: 11px;
		line-height: 1.9;
		color: var(--muted);
		margin: 17px 0 21px;
	}
	.library-art {
		position: relative;
		width: 260px;
		height: 250px;
		display: grid;
		place-items: center;
		isolation: isolate;
		color: #657956;
		transform: rotate(-8deg);
		margin-right: 22px;
	}
	.library-art > :global(svg) {
		filter: drop-shadow(8px 9px 0 #c3cdb1);
	}
	.art-check {
		position: absolute;
		width: 105px;
		height: 105px;
		border-radius: 6px;
		background: #e9eddc;
		z-index: -1;
	}
	.art-check.a {
		left: 20px;
		top: 20px;
	}
	.art-check.b {
		left: 127px;
		top: 20px;
		background: #f5f0db;
	}
	.art-check.c {
		left: 20px;
		top: 127px;
		background: #f5f0db;
	}
	.art-check.d {
		left: 127px;
		top: 127px;
	}
	.art-star {
		position: absolute;
		right: 6px;
		top: 0;
		font-size: 48px;
		color: #c4ad58;
	}
	.art-star.small {
		left: -5px;
		bottom: 26px;
		top: auto;
		font-size: 26px;
		color: #acbb92;
	}
	.library-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		margin: 29px 0 20px;
	}
	.filter-pills {
		display: flex;
		gap: 6px;
	}
	.filter-pills > button {
		padding: 9px 13px;
		display: flex;
		align-items: center;
		gap: 7px;
		background: none;
		color: var(--muted);
		font-size: 10px;
		border-radius: 8px;
		border: 1px solid transparent;
	}
	.filter-pills > button.active {
		background: var(--paper);
		border-color: var(--line);
		color: var(--ink);
		box-shadow: var(--shadow);
		font-weight: 650;
	}
	.filter-pills > button > span {
		background: var(--paper-deep);
		font-size: 8px;
		padding: 2px 5px;
		border-radius: 4px;
		color: var(--muted);
	}
	.game-library {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 18px;
	}
	.import-game-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 30px 15px;
		background: none;
		border: 1px dashed #cdd3bf;
		border-radius: 14px;
		min-height: 260px;
	}
	.import-game-card > span:first-child {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: #e9eddf;
		color: #a0ad8a;
		margin-bottom: 18px;
	}
	.import-game-card > strong {
		font-size: 11px;
		font-weight: 550;
		color: #8d987c;
	}
	.import-game-card > p {
		font-size: 9px;
		line-height: 1.8;
		color: #a4ad96;
		margin-top: 8px;
	}
	.text-link {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 9px;
		color: #82956d;
		margin-top: 23px;
	}
	.empty-search {
		margin: 28px auto;
		text-align: center;
		color: var(--muted);
	}
	.empty-search > :global(svg) {
		margin-bottom: 10px;
	}
	.empty-search h3 {
		font-size: 16px;
		margin-bottom: 10px;
	}
	.empty-search p {
		font-size: 12px;
		margin-bottom: 15px;
	}
	@media (hover: hover) {
		.filter-pills > button:hover {
			background: var(--paper-deep);
		}
		.import-game-card:hover {
			background: #e9eddf60;
		}
	}
	@media (max-width: 1200px) {
		.game-library {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.welcome-content {
			padding: 28px;
		}
		.library-art {
			margin-right: 0;
			transform: scale(0.8) rotate(-8deg);
			width: 210px;
		}
		.welcome-content h2 {
			font-size: 37px;
		}
	}
	@media (max-width: 760px) {
		.welcome-content {
			padding: 28px 24px;
		}
		.welcome-content h2 {
			font-size: 34px;
		}
		.welcome-content p {
			font-size: 10px;
		}
		.library-art {
			width: 175px;
			margin-right: -30px;
			transform: scale(0.65) rotate(-8deg);
			transform-origin: center center;
		}
		.welcome-content > div:first-child {
			flex-shrink: 0;
			z-index: 1;
		}
		.library-toolbar {
			gap: 14px;
			flex-wrap: wrap;
			margin-top: 24px;
		}
		.filter-pills > button {
			font-size: 10px;
			padding: 8px 11px;
		}
		.game-library {
			grid-template-columns: 1fr;
			gap: 16px;
		}
		.import-game-card {
			min-height: 225px;
		}
		.import-game-card > strong {
			font-size: 12px;
		}
		.import-game-card > p {
			font-size: 10px;
		}
		.text-link {
			font-size: 11px;
		}
	}
	@media (max-width: 360px) {
		.library-art {
			opacity: 0.5;
			margin-right: -70px;
		}
	}
	:global(:root[data-theme='dark']) .import-game-card {
		border-color: #566346;
	}
	:global(:root[data-theme='dark']) .art-check {
		opacity: 0.12;
	}
	.welcome-content :global(.welcome-action) {
		--button-font-size: 10px;
		--button-min-height: 39px;
	}
	@media (max-width: 760px) {
		.welcome-content :global(.welcome-action) {
			--button-font-size: 9px;
		}
	}
	.library-toolbar > :global(.search-field) {
		--input-shell-width: auto;
		--input-width: 165px;
	}
	@media (max-width: 760px) {
		.library-toolbar > :global(.search-field) {
			--input-shell-width: 100%;
			--input-width: 100%;
			--input-font-size: 12px;
			--input-height: 40px;
		}
	}
</style>
