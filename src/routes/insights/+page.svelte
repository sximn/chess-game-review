<script lang="ts">
	import Card from '#lib/components/Card.svelte';
	import FieldMessage from '#lib/components/FieldMessage.svelte';
	import PageHeading from '#lib/components/PageHeading.svelte';
	import Button from '#lib/components/Button.svelte';
	import MiniEyebrow from '#lib/components/MiniEyebrow.svelte';
	import { ArrowUpRight, BookOpen, Flag, Lightbulb, Plus, Sprout } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
	import { parseGame } from '#lib/chess.js';

	let imported = $derived(app.games.filter((g) => g.id !== 'opera'));
	let totalMoves = $derived(
		imported.reduce((sum, game) => sum + Math.ceil(parseGame(game.pgn).moves.length / 2), 0)
	);
	let statistics = $derived([
		{
			label: 'Your collection',
			value: imported.length,
			description: imported.length === 1 ? 'game imported' : 'games imported',
			icon: BookOpen
		},
		{
			label: 'Moments to explore',
			value: totalMoves,
			description: 'moves in your games',
			icon: Flag
		},
		{
			label: 'The next chapter',
			value: 'Yours.',
			description: 'Every game is a chance to learn.',
			icon: Sprout
		}
	]);
</script>

<svelte:head><title>My insights · Up a Pawn</title></svelte:head>

<PageHeading title="A little wiser" />

<div class="insight-stats">
	{#each statistics as stat}
		<Card class="stat-card" shadow
			><span class="stat-label"><stat.icon size={20} /> {stat.label}</span><strong
				class="stat-value">{stat.value}</strong
			>
			<p class="stat-description">{stat.description}</p></Card
		>
	{/each}
</div>
<Card as="section" class="insights-story" style="--card-radius:16px;margin-top:26px"
	><div class="story-content">
		<div class="insights-leaf"><Sprout size={55} strokeWidth={1.2} /></div>
		<MiniEyebrow>GROW AT YOUR OWN PACE</MiniEyebrow>
		<h2>Progress isn’t always a number.</h2>
		<p>
			Sometimes it’s spotting a tactic a little earlier.<br />Sometimes it’s taking a breath before
			a move.<br />Start with one game, and see what you notice.
		</p>
		<Button variant="primary" onclick={() => (app.importOpen = true)}
			><Plus size={18} /> Add your next game</Button
		>
		<FieldMessage class="field-hint"
			>Personal accuracy trends will arrive with engine analysis.</FieldMessage
		>
	</div></Card
>
<Card
	as="a"
	class="insights-tip"
	href="/?game=opera"
	variant="soft"
	style="--card-radius:13px;margin-top:20px"
	><div class="tip-content">
		<span class="coach-icon"><Lightbulb size={22} /></span>
		<div>
			<MiniEyebrow tip>BORROW A LITTLE BRILLIANCE</MiniEyebrow>
			<h3>A masterclass in making every piece count.</h3>
			<p>Revisit Morphy’s Opera Game, one small discovery at a time.</p>
		</div>
		<ArrowUpRight size={23} />
	</div></Card
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
	:global(:root[data-theme='dark']) .coach-icon {
		background: #3b4b30;
		border-color: #526443;
		color: #adbf96;
	}
	.insight-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
		--card-padding: 24px;
		--card-radius: 13px;
	}
	.stat-label {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 10px;
		color: var(--muted);
	}
	.stat-label > :global(svg) {
		color: #9aac83;
	}
	.stat-value {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 44px;
		line-height: 1.4;
		display: block;
		margin-top: 14px;
	}
	.stat-description {
		font-size: 9px;
		color: var(--muted);
		margin-top: 3px;
	}
	.story-content {
		padding: 38px 20px;
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
	.story-content h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-weight: 400;
		font-size: 35px;
		margin: 12px 0 17px;
	}
	.story-content > p {
		font-size: 12px;
		line-height: 2;
		color: var(--muted);
		margin-bottom: 25px;
	}
	.tip-content {
		display: flex;
		align-items: center;
		gap: 20px;
		padding: 24px;
	}
	.tip-content .coach-icon {
		width: 42px;
		height: 42px;
		border-radius: 12px;
	}
	.tip-content h3 {
		font-size: 14px;
		letter-spacing: -0.3px;
		margin: 8px 0;
	}
	.tip-content p {
		font-size: 10px;
		color: #96a083;
	}
	.tip-content > :global(svg) {
		margin-left: auto;
		color: #97a77f;
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.insight-stats {
			gap: 12px;
			--card-padding: 18px;
		}
		.stat-label {
			font-size: 8px;
			gap: 6px;
		}
		.stat-value {
			font-size: 37px;
		}
		.stat-description {
			font-size: 8px;
		}
	}
	@media (max-width: 760px) {
		.insight-stats {
			gap: 9px;
			--card-padding: 16px 11px;
		}
		.stat-label {
			font-size: 8px;
			line-height: 1.6;
			display: block;
			min-height: 44px;
		}
		.stat-label > :global(svg) {
			display: block;
			margin-bottom: 9px;
			width: 19px;
		}
		.stat-value {
			font-size: 31px;
			margin-top: 8px;
		}
		.stat-description {
			font-size: 8px;
			line-height: 1.8;
		}
		.story-content {
			padding: 32px 20px;
		}
		.story-content h2 {
			font-size: 28px;
		}
		.story-content > p {
			font-size: 10px;
		}
		.insights-leaf {
			width: 82px;
			height: 82px;
		}
		.tip-content {
			gap: 13px;
			padding: 20px 16px;
		}
		.tip-content .coach-icon {
			width: 34px;
			height: 34px;
		}
		.tip-content h3 {
			font-size: 12px;
			line-height: 1.5;
		}
		.tip-content p {
			font-size: 9px;
			line-height: 1.8;
		}
		.tip-content > :global(svg) {
			width: 19px;
		}
	}
	@media (max-width: 360px) {
		.stat-value {
			font-size: 26px;
		}
	}
	:global(:root[data-theme='dark']) .insights-leaf {
		border-color: #445238;
	}
	@media (min-width: 1001px) {
		.stat-description {
			font-size: 11px;
		}
		.stat-label {
			font-size: 12px;
		}
	}
	.story-content > :global(.field-hint) {
		--field-message-font-size: 9px;
		--field-message-mobile-font-size: 8px;
		--field-message-line-height: 2;
		--field-message-margin: 14px 0 0;
	}
</style>
