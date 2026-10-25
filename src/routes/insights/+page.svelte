<script lang="ts">
	import { ArrowUpRight, BookOpen, Flag, Lightbulb, Plus, Sprout, TrendingUp } from 'lucide-svelte';
	import { app } from '$lib/state.svelte';
	import { parseGame } from '$lib/chess';
	let imported = $derived(app.games.filter((g) => g.id !== 'opera'));
	let totalMoves = $derived(
		imported.reduce((sum, game) => sum + Math.ceil(parseGame(game.pgn).moves.length / 2), 0)
	);
</script>

<svelte:head><title>My insights · Paper & Ink</title></svelte:head>
<div class="page-heading">
	<div>
		<div class="eyebrow"><span></span> SMALL STEPS, LASTING PROGRESS</div>
		<h1>A little wiser<span class="heading-dot">.</span></h1>
		<p>Your journey is yours. Give it time to grow.</p>
	</div>
</div>
<div class="insight-stats">
	<div class="stat-card">
		<span><BookOpen size={20} /> Your collection</span><strong>{imported.length}</strong>
		<p>{imported.length === 1 ? 'game imported' : 'games imported'}</p>
	</div>
	<div class="stat-card">
		<span><Flag size={20} /> Moments to explore</span><strong>{totalMoves}</strong>
		<p>moves in your games</p>
	</div>
	<div class="stat-card">
		<span><Sprout size={20} /> The next chapter</span><strong>Yours.</strong>
		<p>Every game is a chance to learn.</p>
	</div>
</div>
<section class="insights-story">
	<div class="insights-leaf"><Sprout size={55} strokeWidth={1.2} /></div>
	<span class="mini-eyebrow">GROW AT YOUR OWN PACE</span>
	<h2>Progress isn’t always a number.</h2>
	<p>
		Sometimes it’s spotting a tactic a little earlier.<br />Sometimes it’s taking a breath before a
		move.<br />Start with one game, and see what you notice.
	</p>
	<button class="button primary" onclick={() => (app.importOpen = true)}
		><Plus size={18} /> Add your next game</button
	>
	<p class="field-hint">Personal accuracy trends will arrive with engine analysis.</p>
</section>
<a class="insights-tip" href="/?game=opera"
	><span class="coach-icon"><Lightbulb size={22} /></span>
	<div>
		<span class="mini-eyebrow">BORROW A LITTLE BRILLIANCE</span>
		<h3>A masterclass in making every piece count.</h3>
		<p>Revisit Morphy’s Opera Game, one small discovery at a time.</p>
	</div>
	<ArrowUpRight size={23} /></a
>
