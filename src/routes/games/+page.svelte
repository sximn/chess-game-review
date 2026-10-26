<script lang="ts">
	import PageHeading from '#lib/components/PageHeading.svelte';
	import ActionButton from '#lib/components/ActionButton.svelte';
	import MiniEyebrow from '#lib/components/MiniEyebrow.svelte';
	import {
		ArrowUpRight,
		BookOpen,
		ChevronRight,
		FileUp,
		Plus,
		Search,
		Trophy
	} from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
	import { parseGame } from '#lib/chess.js';
	import Knight from '#lib/components/Knight.svelte';
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

<svelte:head><title>My games · Paper & Ink</title></svelte:head>
<PageHeading
	title="My games"
	eyebrow="A COLLECTION OF LITTLE LESSONS"
	description="Old favorites. Fresh perspectives. All in one place."
>
	{#snippet actions()}<ActionButton presentation="heading" onclick={() => (app.importOpen = true)}
			><Plus size={18} /> Import game</ActionButton
		>{/snippet}
</PageHeading>
<section class="library-welcome">
	<div>
		<MiniEyebrow>YOUR NEXT CHAPTER</MiniEyebrow>
		<h2>Good games.<br /><em>Better lessons.</em></h2>
		<p>That game you can’t stop thinking about?<br />Bring it here. Let’s take another look.</p>
		<ActionButton variant="secondary" presentation="welcome" onclick={() => (app.importOpen = true)}
			>Bring a game along <ArrowUpRight size={16} /></ActionButton
		>
	</div>
	<div class="library-art" aria-hidden="true">
		<span class="art-check a"></span><span class="art-check b"></span><span class="art-check c"
		></span><span class="art-check d"></span><Knight size={164} /><span class="art-star">✧</span
		><span class="art-star small">✦</span>
	</div>
</section>
<div class="library-toolbar">
	<div class="filter-pills" aria-label="Filter games">
		{#each [{ value: 'all', label: 'All games' }, { value: 'imported', label: 'Imported' }, { value: 'sample', label: 'Classics' }] as item}<button
				class:active={filter === item.value}
				aria-pressed={filter === item.value}
				onclick={() => (filter = item.value)}
				>{item.label}{#if item.value === 'all'}<span>{app.games.length}</span>{/if}</button
			>{/each}
	</div>
	<div class="search-field">
		<Search size={17} /><input
			aria-label="Search games"
			bind:value={query}
			placeholder="Find a player or game…"
		/>
	</div>
</div>
<div class="game-library">
	{#each games as game}<a href={`/?game=${encodeURIComponent(game.id)}`} class="library-game"
			><div class="library-game-top">
				<span class="library-game-icon"><Knight size={30} /></span><span class="chip"
					>{game.id === 'opera' ? 'A CLASSIC' : 'IMPORTED'}</span
				>
			</div>
			<h2>
				{game.id === 'opera' ? 'A night at the opera' : game.headers.Event || 'A game to remember'}
			</h2>
			<p>{game.headers.White || 'White'} <span>vs.</span> {game.headers.Black || 'Black'}</p>
			<div class="library-game-meta">
				<span><BookOpen size={14} /> {Math.ceil(game.moves.length / 2)} moves</span><span
					><Trophy size={14} />{game.headers.Result === '1-0'
						? 'White won'
						: game.headers.Result === '0-1'
							? 'Black won'
							: game.headers.Result === '1/2-1/2'
								? 'Draw'
								: 'Unfinished'}</span
				>
			</div>
			<div class="library-game-bottom">
				<span>Take another look</span><ArrowUpRight size={19} />
			</div></a
		>{/each}<button class="import-game-card" onclick={() => (app.importOpen = true)}
		><span><Plus size={28} /></span><strong>A little room for your game.</strong>
		<p>Import a PGN and start a new review.</p>
		<span class="text-link">Add a game {@render ArrowRightIcon()}</span></button
	>
</div>
{#if games.length === 0}<div class="empty-search">
		<Search size={24} />
		<h3>No games found.</h3>
		<p>Try a different name or another filter.</p>
		<ActionButton
			variant="secondary"
			onclick={() => {
				query = '';
				filter = 'all';
			}}>Show all games</ActionButton
		>
	</div>{/if}
{#snippet ArrowRightIcon()}<ChevronRight size={16} />{/snippet}

<style>
	.library-welcome {
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 18px;
		padding: 35px 40px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: var(--shadow);
		overflow: hidden;
	}
	.library-welcome h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 43px;
		line-height: 1.12;
		margin-top: 14px;
		letter-spacing: -1px;
	}
	.library-welcome h2 em {
		color: #91a37c;
		font-weight: 400;
	}
	.library-welcome p {
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
	.search-field {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 9px;
		padding: 0 11px;
		color: #a1aa91;
	}
	.search-field > input {
		font-size: 10px;
		height: 36px;
		border: 0;
		background: none;
		outline: none;
		color: var(--ink);
		width: 165px;
	}
	.search-field:focus-within {
		box-shadow: var(--ring);
	}
	.game-library {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 18px;
	}
	.library-game {
		padding: 22px 22px 0;
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 14px;
		box-shadow: var(--shadow);
		overflow: hidden;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}
	.library-game-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-bottom: 22px;
	}
	.library-game-icon {
		width: 40px;
		height: 43px;
		background: var(--paper-deep);
		display: grid;
		place-items: center;
		border-radius: 10px;
		color: #7f9068;
		border: 1px solid var(--line);
	}
	.chip {
		font-size: 7px;
		letter-spacing: 0.8px;
		border: 1px solid var(--line);
		padding: 5px 7px;
		border-radius: 5px;
		color: #9da78d;
	}
	.library-game h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-size: 22px;
		font-weight: 400;
		margin-bottom: 9px;
	}
	.library-game > p {
		font-size: 10px;
		color: var(--muted);
		line-height: 1.7;
	}
	.library-game > p > span {
		color: #b0b69f;
		font-size: 8px;
		margin: 0 3px;
	}
	.library-game-meta {
		display: flex;
		gap: 15px;
		margin: 21px 0;
		color: #a0aa8e;
		font-size: 8px;
	}
	.library-game-meta > span {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.library-game-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 0 -22px;
		background: var(--surface-green);
		border-top: 1px solid var(--line);
		padding: 13px 22px;
		color: #8a9b72;
		font-size: 9px;
		font-weight: 600;
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
		.library-game:hover {
			transform: translateY(-3px);
			box-shadow: 0 8px 20px #424d2410;
		}
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
		.library-welcome {
			padding: 28px;
		}
		.library-art {
			margin-right: 0;
			transform: scale(0.8) rotate(-8deg);
			width: 210px;
		}
		.library-welcome h2 {
			font-size: 37px;
		}
	}
	@media (max-width: 760px) {
		.library-welcome {
			padding: 28px 24px;
		}
		.library-welcome h2 {
			font-size: 34px;
		}
		.library-welcome p {
			font-size: 10px;
		}
		.library-art {
			width: 175px;
			margin-right: -30px;
			transform: scale(0.65) rotate(-8deg);
			transform-origin: center center;
		}
		.library-welcome > div:first-child {
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
		.search-field {
			width: 100%;
		}
		.search-field > input {
			width: 100%;
			font-size: 12px;
			height: 40px;
		}
		.game-library {
			grid-template-columns: 1fr;
			gap: 16px;
		}
		.library-game {
			padding: 22px 24px 0;
		}
		.library-game h2 {
			font-size: 26px;
		}
		.library-game > p {
			font-size: 11px;
		}
		.library-game-meta {
			font-size: 10px;
		}
		.library-game-top {
			margin-bottom: 18px;
		}
		.library-game-bottom {
			margin: 0 -24px;
			padding: 15px 24px;
			font-size: 11px;
		}
		.library-game-icon {
			width: 45px;
			height: 47px;
		}
		.chip {
			font-size: 8px;
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
	:global(:root[data-theme='dark']) .library-game-bottom {
		color: #b1c49a;
	}
	:global(:root[data-theme='dark']) .import-game-card {
		border-color: #566346;
	}
	:global(:root[data-theme='dark']) .art-check {
		opacity: 0.12;
	}
	@media (min-width: 1001px) {
		.library-game > p {
			font-size: 12px;
		}
		.library-game-meta {
			font-size: 10px;
		}
	}
	input::placeholder {
		color: #a6ad98;
	}
</style>
