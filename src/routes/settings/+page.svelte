<script lang="ts">
	import Card from '#lib/components/ui/Card.svelte';
	import Field from '#lib/components/ui/Field.svelte';
	import PageHeading from '#lib/components/app/PageHeading.svelte';
	import PreferenceSwitch from '#lib/components/ui/PreferenceSwitch.svelte';
	import { Check, Moon, Sun } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
	import { pieceSets, pieceSrc } from '#lib/pieces.js';
</script>

<svelte:head><title>Preferences · Up a Pawn</title></svelte:head>

<PageHeading title="Just your style" />

<div class="settings-layout">
	<Card as="section" class="settings-card">
		<div class="settings-content">
			<h2>Theme</h2>
			<div class="theme-options">
				<button
					class:selected={app.theme === 'light'}
					aria-pressed={app.theme === 'light'}
					onclick={() => (app.theme = 'light')}
				>
					<div class="theme-preview light-preview">
						<span></span>
						<span></span>
						<span></span>
						<Sun size={25} />
					</div>
					<span>
						Light
						{#if app.theme === 'light'}
							<Check size={17} />
						{/if}
					</span>
				</button>
				<button
					class:selected={app.theme === 'dark'}
					aria-pressed={app.theme === 'dark'}
					onclick={() => (app.theme = 'dark')}
				>
					<div class="theme-preview dark-preview">
						<span></span>
						<span></span>
						<span></span>
						<Moon size={25} />
					</div>
					<span>
						Dark
						{#if app.theme === 'dark'}
							<Check size={17} />
						{/if}
					</span>
				</button>
			</div>

			<div class="settings-divider"></div>
			<h2>Board</h2>
			<h3 id="piece-set-label">Piece set</h3>
			<p class="piece-set-description">Choose the pieces for your boards.</p>
			<div class="theme-options piece-options" role="group" aria-labelledby="piece-set-label">
				{#each pieceSets as set}
					<button
						class:selected={app.pieceSet === set.id}
						aria-pressed={app.pieceSet === set.id}
						onclick={() => (app.pieceSet = set.id)}
					>
						<div class="piece-preview" aria-hidden="true">
							{#each ['w', 'b'] as const as color}
								{#each ['k', 'n', 'p'] as const as type}
									<div class="preview-square" class:dark={color === 'b'}>
										<img src={pieceSrc(set.id, color, type)} alt="" draggable="false" />
									</div>
								{/each}
							{/each}
						</div>
						<span>
							{set.label}
							{#if app.pieceSet === set.id}<Check size={17} />{/if}
						</span>
					</button>
				{/each}
			</div>
			<Field
				controlId="coordinates"
				label="Board coordinates"
				description="Little a-h & 1-8 marks on the tiles"
				layout="inline"
				class="setting-row"
			>
				<PreferenceSwitch bind:checked={app.coordinates} />
			</Field>
			<Field controlId="evaluation" label="Evaluation bar" layout="inline" class="setting-row">
				<PreferenceSwitch bind:checked={app.showEvaluation} />
			</Field>
			<div class="settings-divider"></div>
			<h2>Local analysis</h2>
			<p class="analysis-notice">Frozenight runs on this device. Games stay private.</p>
			<a class="diagnostics-link" href="/diagnostics">Engine diagnostics</a>
		</div></Card
	>
</div>

<style>
	.diagnostics-link {
		display: block;
		min-height: 36px;
		padding: 8px 0;
		font-size: var(--text-md);
		text-decoration: underline;
	}
	.analysis-notice {
		font-size: var(--text-sm);
		line-height: var(--leading-relaxed);
		color: var(--muted);
	}

	.settings-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(200px, 0.8fr);
		align-items: start;
		gap: 28px;
	}
	.settings-content {
		padding: 31px;
	}
	.settings-content h2 {
		font-family: var(--font-display);
		font-size: var(--text-heading);
		font-weight: var(--weight-regular);
		margin: 11px 0 10px;
	}
	.theme-options {
		display: flex;
		gap: 15px;
		margin-top: 26px;
	}
	.theme-options > button {
		flex: 1;
		min-width: 0;
		background: none;
		border: 1px solid var(--line);
		border-radius: var(--radius-md);
		padding: 5px;
	}
	.theme-options > button.selected {
		border-color: var(--active-border);
		box-shadow: var(--active-ring);
	}
	.theme-preview {
		height: 110px;
		position: relative;
		border-radius: var(--radius-sm);
		padding: 17px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.light-preview {
		background: #f3f3f3;
	}
	.dark-preview {
		background: #242424;
	}
	.theme-preview > span {
		height: 7px;
		background: #d9d9d9;
		border-radius: 3px;
		width: 54%;
		display: block;
	}
	.theme-preview > span:nth-child(2) {
		width: 70%;
		height: 25px;
		background: #c9c9c9;
		margin-top: 3px;
	}
	.theme-preview > span:nth-child(3) {
		width: 40%;
		background: #e5cb70;
	}
	.dark-preview > span {
		background: #454545;
	}
	.dark-preview > span:nth-child(2) {
		background: #686868;
	}
	.dark-preview > span:nth-child(3) {
		background: #a58e3b;
	}
	.theme-preview > :global(svg) {
		position: absolute;
		right: 15px;
		bottom: 15px;
		color: #8a773d;
	}
	.theme-options > button > span {
		font-size: var(--text-sm);
		padding: 12px 7px 8px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.theme-options > button > span > :global(svg) {
		color: var(--active-text);
	}
	.settings-divider {
		height: 1px;
		background: var(--line);
		margin: 30px 0;
	}
	.settings-content h3 {
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		margin: 22px 0 6px;
	}
	.piece-set-description {
		font-size: var(--text-sm);
		line-height: var(--leading-body);
		color: var(--muted);
	}
	.piece-options {
		margin-top: 14px;
	}
	.piece-preview {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		border-radius: var(--radius-sm);
		overflow: hidden;
	}
	.preview-square {
		display: grid;
		place-items: center;
		background: var(--board-light);
		aspect-ratio: 1;
	}
	.preview-square.dark {
		background: var(--board-dark);
	}
	.preview-square img {
		width: 85%;
		height: 85%;
		object-fit: contain;
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.settings-layout {
			gap: 15px;
			grid-template-columns: minmax(0, 1.5fr) minmax(170px, 0.8fr);
		}
		.settings-content {
			padding: 23px;
		}
		.settings-content h2 {
			font-size: var(--text-title);
		}
		.theme-options {
			gap: 9px;
		}
		.theme-preview {
			padding: 14px;
		}
	}
	@media (max-width: 760px) {
		.settings-layout {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		.settings-content {
			padding: 25px 22px;
		}
		.theme-options {
			gap: 12px;
		}
		.theme-preview {
			height: 115px;
		}
		.theme-options > button > span {
			font-size: var(--text-sm);
		}
	}
	.settings-content > :global(.setting-row) {
		--field-margin-top: 26px;
	}
</style>
