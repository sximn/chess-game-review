<script lang="ts">
	import PageHeading from '#lib/components/PageHeading.svelte';
	import ActionButton from '#lib/components/ActionButton.svelte';
	import MiniEyebrow from '#lib/components/MiniEyebrow.svelte';
	import { ArrowUpRight, BookOpen, Flag, Lightbulb, Plus, Sprout, TrendingUp } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
	import { parseGame } from '#lib/chess.js';
	let imported = $derived(app.games.filter((g) => g.id !== 'opera'));
	let totalMoves = $derived(
		imported.reduce((sum, game) => sum + Math.ceil(parseGame(game.pgn).moves.length / 2), 0)
	);
</script>

<svelte:head><title>My insights · Paper & Ink</title></svelte:head>
<PageHeading
	title="A little wiser"
	eyebrow="SMALL STEPS, LASTING PROGRESS"
	description="Your journey is yours. Give it time to grow."
/>
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
	<MiniEyebrow>GROW AT YOUR OWN PACE</MiniEyebrow>
	<h2>Progress isn’t always a number.</h2>
	<p>
		Sometimes it’s spotting a tactic a little earlier.<br />Sometimes it’s taking a breath before a
		move.<br />Start with one game, and see what you notice.
	</p>
	<ActionButton variant="primary" onclick={() => (app.importOpen = true)}
		><Plus size={18} /> Add your next game</ActionButton
	>
	<p class="field-hint">Personal accuracy trends will arrive with engine analysis.</p>
</section>
<a class="insights-tip" href="/?game=opera"
	><span class="coach-icon"><Lightbulb size={22} /></span>
	<div>
		<MiniEyebrow tip>BORROW A LITTLE BRILLIANCE</MiniEyebrow>
		<h3>A masterclass in making every piece count.</h3>
		<p>Revisit Morphy’s Opera Game, one small discovery at a time.</p>
	</div>
	<ArrowUpRight size={23} /></a
>

<style>
	.coach-icon {
		width: 27px;
		height: 27px;
		background: #e0e8d1;
		border: 1px solid #d1ddbf;
		border-radius: 8px;
		color: #7f9363;
		display: grid;
		place-items: center;
		flex-shrink: 0;
	}
	.field-hint {
		font-size: 9px;
		line-height: 1.8;
		color: var(--muted);
		margin-top: 9px;
	}
	@media (max-width: 760px) {
		.field-hint {
			font-size: 10px;
		}
	}
	:global(:root[data-theme='dark']) .coach-icon {
		background: #3b4b30;
		border-color: #526443;
		color: #adbf96;
	}
	.insight-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
	}
	.stat-card {
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 13px;
		padding: 24px;
		box-shadow: var(--shadow);
	}
	.stat-card > span {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 10px;
		color: var(--muted);
	}
	.stat-card > span > :global(svg) {
		color: #9aac83;
	}
	.stat-card > strong {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 44px;
		line-height: 1.4;
		display: block;
		margin-top: 14px;
	}
	.stat-card > p {
		font-size: 9px;
		color: var(--muted);
		margin-top: 3px;
	}
	.insights-story {
		margin-top: 26px;
		padding: 38px 20px;
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 16px;
		text-align: center;
	}
	.insights-leaf {
		width: 100px;
		height: 100px;
		border: 1px solid #e0e6d3;
		background: var(--surface-green);
		border-radius: 50%;
		display: grid;
		place-items: center;
		margin: 0 auto 26px;
		color: #92a97a;
	}
	.insights-story h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 35px;
		margin: 12px 0 17px;
	}
	.insights-story > p {
		font-size: 12px;
		line-height: 2;
		color: var(--muted);
		margin-bottom: 25px;
	}
	.insights-story .field-hint {
		font-size: 9px;
		margin: 14px 0 0;
	}
	.insights-tip {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 24px;
		background: var(--surface-green);
		border: 1px solid var(--line);
		border-radius: 13px;
		margin-top: 20px;
	}
	.insights-tip .coach-icon {
		width: 42px;
		height: 42px;
		border-radius: 12px;
	}
	.insights-tip h3 {
		font-size: 14px;
		letter-spacing: -0.3px;
		margin: 8px 0;
	}
	.insights-tip p {
		font-size: 10px;
		color: #96a083;
	}
	.insights-tip > :global(svg) {
		margin-left: auto;
		color: #97a77f;
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.insight-stats {
			gap: 12px;
		}
		.stat-card {
			padding: 18px;
		}
		.stat-card > span {
			font-size: 8px;
			gap: 6px;
		}
		.stat-card > strong {
			font-size: 37px;
		}
		.stat-card > p {
			font-size: 8px;
		}
	}
	@media (max-width: 760px) {
		.insight-stats {
			gap: 9px;
		}
		.stat-card {
			padding: 16px 11px;
		}
		.stat-card > span {
			font-size: 8px;
			line-height: 1.6;
			display: block;
			min-height: 44px;
		}
		.stat-card > span > :global(svg) {
			display: block;
			margin-bottom: 9px;
			width: 19px;
		}
		.stat-card > strong {
			font-size: 31px;
			margin-top: 8px;
		}
		.stat-card > p {
			font-size: 8px;
			line-height: 1.8;
		}
		.insights-story {
			padding: 32px 20px;
		}
		.insights-story h2 {
			font-size: 28px;
		}
		.insights-story > p {
			font-size: 10px;
		}
		.insights-leaf {
			width: 82px;
			height: 82px;
		}
		.insights-story .field-hint {
			font-size: 8px;
		}
		.insights-tip {
			gap: 13px;
			padding: 20px 16px;
		}
		.insights-tip .coach-icon {
			width: 34px;
			height: 34px;
		}
		.insights-tip h3 {
			font-size: 12px;
			line-height: 1.5;
		}
		.insights-tip p {
			font-size: 9px;
			line-height: 1.8;
		}
		.insights-tip > :global(svg) {
			width: 19px;
		}
	}
	@media (max-width: 360px) {
		.stat-card > strong {
			font-size: 26px;
		}
	}
	:global(:root[data-theme='dark']) .insights-leaf {
		border-color: #445238;
	}
	@media (min-width: 1001px) {
		.stat-card > p {
			font-size: 11px;
		}
		.stat-card > span {
			font-size: 12px;
		}
	}
</style>
