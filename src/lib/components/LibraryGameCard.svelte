<script lang="ts">
	import { ArrowUpRight, BookOpen, Trophy } from 'lucide-svelte';
	import type { SavedGame, Timeline } from '#lib/chess.js';
	import Knight from './Knight.svelte';
	import Card from './Card.svelte';
	let { game }: { game: SavedGame & Timeline } = $props();
</script>

<Card
	as="a"
	href={`/?game=${encodeURIComponent(game.id)}`}
	class="library-game"
	shadow
	interactive
	clip
>
	<div class="game-card-content">
		<div class="library-game-top">
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
		</div>
	</div>
</Card>

<style>
	.game-card-content {
		padding: 22px 22px 0;
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
	.game-card-content h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-size: 22px;
		font-weight: 400;
		margin-bottom: 9px;
	}
	.game-card-content > p {
		font-size: 10px;
		color: var(--muted);
		line-height: 1.7;
	}
	.game-card-content > p > span {
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
	@media (max-width: 760px) {
		.game-card-content {
			padding: 22px 24px 0;
		}
		.game-card-content h2 {
			font-size: 26px;
		}
		.game-card-content > p {
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
	}
	:global(:root[data-theme='dark']) .library-game-bottom {
		color: #b1c49a;
	}
	@media (min-width: 1001px) {
		.game-card-content > p {
			font-size: 12px;
		}
		.library-game-meta {
			font-size: 10px;
		}
	}
</style>
