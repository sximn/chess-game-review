<script lang="ts">
	import AppLogo from './AppLogo.svelte';
	let {
		name,
		position,
		whitePiece,
		showEvaluation,
		winner = false
	}: {
		name: string;
		position: 'opponent' | 'self';
		whitePiece: boolean;
		showEvaluation: boolean;
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
		border-radius: 6px;
		border: 1px solid #394337;
		box-shadow:
			inset 0 1px #fff1,
			0 2px 3px #0000000a;
	}
	.dark-player {
		background: #3b4436;
		color: #e5e7d5;
	}
	.light-player {
		background: var(--paper);
		color: #9b9f86;
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
		font-size: 12px;
		font-weight: 650;
		letter-spacing: -0.1px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.player-winner {
		font-size: 6px;
		letter-spacing: 0.8px;
		font-weight: 700;
		color: #88a074;
		background: #eaf0df;
		border-radius: 3px;
		padding: 3px 4px;
		margin-left: 6px;
	}
	.piece-color {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #4c5145;
		border: 1px solid #313d32;
		margin: 0 6px 0 10px;
	}
	.piece-color.white-piece {
		background: #fffcf0;
		border-color: #cccdb9;
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.player-winner {
			letter-spacing: 0.3px;
		}
	}
	@media (max-width: 760px) {
		.player-details strong {
			font-size: 11px;
		}
	}
	:global(:root[data-theme='dark']) .player-winner {
		background: #3b4e2c;
		color: #b1c99b;
	}
	:global(:root[data-theme='dark']) .light-player {
		color: #c1caac;
	}
</style>
