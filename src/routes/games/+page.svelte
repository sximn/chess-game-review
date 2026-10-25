<script lang="ts">
	import {
		ArrowUpRight,
		BookOpen,
		ChevronRight,
		FileUp,
		Plus,
		Search,
		Trophy
	} from 'lucide-svelte';
	import { app } from '$lib/state.svelte';
	import { parseGame } from '$lib/chess';
	import Knight from '$lib/components/Knight.svelte';
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
<div class="page-heading">
	<div>
		<div class="eyebrow"><span></span> A COLLECTION OF LITTLE LESSONS</div>
		<h1>My games<span class="heading-dot">.</span></h1>
		<p>Old favorites. Fresh perspectives. All in one place.</p>
	</div>
	<button class="button primary" onclick={() => (app.importOpen = true)}
		><Plus size={18} /> Import game</button
	>
</div>
<section class="library-welcome">
	<div>
		<span class="mini-eyebrow">YOUR NEXT CHAPTER</span>
		<h2>Good games.<br /><em>Better lessons.</em></h2>
		<p>That game you can’t stop thinking about?<br />Bring it here. Let’s take another look.</p>
		<button class="button secondary" onclick={() => (app.importOpen = true)}
			>Bring a game along <ArrowUpRight size={16} /></button
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
		<button
			class="button secondary"
			onclick={() => {
				query = '';
				filter = 'all';
			}}>Show all games</button
		>
	</div>{/if}
{#snippet ArrowRightIcon()}<ChevronRight size={16} />{/snippet}
