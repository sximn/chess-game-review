<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppLogo from '#lib/components/app/AppLogo.svelte';
	let {
		name,
		position,
		whitePiece,
		showEvaluation,
		context,
		winner = false
	}: {
		name: string;
		position: 'opponent' | 'self';
		whitePiece: boolean;
		showEvaluation: boolean;
		context?: Snippet;
		winner?: boolean;
	} = $props();
</script>

<div
	class="player-row"
	class:opponent={position === 'opponent'}
	class:self={position === 'self'}
	class:no-evaluation={!showEvaluation}
>
	<div
		class="player-avatar"
		class:dark-player={position === 'opponent'}
		class:light-player={position === 'self'}
	>
		<AppLogo size={20} />
	</div>
	<div class="player-details">
		<strong
			>{name}{#if winner}<span class="player-winner">WINNER</span>{/if}</strong
		>
	</div>
	{#if context}{@render context()}{/if}
	<span class="piece-color" class:white-piece={whitePiece}></span>
</div>

<style>
	.player-row {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 28px;
		min-height: 28px;
		padding: 0 0 0 21px;
	}
	.player-row.no-evaluation {
		padding-left: 0;
	}
	.player-avatar {
		display: grid;
		place-items: center;
		height: 23px;
		width: 23px;
		border-radius: var(--radius-xs);
		border: 1px solid var(--chess-side-dark);
		box-shadow:
			inset 0 1px #fff1,
			0 2px 3px #0000000a;
	}
	.dark-player {
		background: var(--chess-side-dark);
		color: var(--chess-side-light);
	}
	.light-player {
		background: var(--paper);
		color: var(--text-secondary);
		border-color: var(--line);
	}
	.player-details {
		flex: 1;
		min-width: 0;
	}
	.player-details strong {
		display: block;
		align-items: center;
		gap: 7px;
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		letter-spacing: var(--tracking-ui);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.player-winner {
		font-size: var(--text-caption);
		letter-spacing: var(--tracking-label);
		font-weight: var(--weight-bold);
		color: var(--success-text);
		background: var(--success-bg);
		border-radius: var(--radius-xs);
		padding: 3px 4px;
		margin-left: 6px;
	}
	.piece-color {
		width: 8px;
		height: 8px;
		border-radius: var(--radius-round);
		background: var(--chess-side-dark);
		border: 1px solid var(--chess-side-border);
		margin: 0 6px 0 10px;
	}
	.piece-color.white-piece {
		background: var(--chess-side-light);
		border-color: var(--chess-side-border);
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.player-winner {
			letter-spacing: 0.3px;
		}
	}
	@media (max-width: 760px) {
		.player-details strong {
			font-size: var(--text-sm);
		}
	}
</style>
