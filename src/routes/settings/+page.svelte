<script lang="ts">
	import PageHeading from '#lib/components/PageHeading.svelte';
	import MiniEyebrow from '#lib/components/MiniEyebrow.svelte';
	import PreferenceSwitch from '#lib/components/PreferenceSwitch.svelte';
	import { ArrowLeft, Check, Moon, Sun, Monitor, Smartphone, ShieldCheck } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
</script>

<svelte:head><title>Preferences · Paper & Ink</title></svelte:head>
<PageHeading
	title="Just your style"
	eyebrow="MAKE YOURSELF AT HOME"
	description="A few small adjustments. A space that feels like you."
/>
<div class="settings-layout">
	<section class="settings-card">
		<MiniEyebrow>THE LOOK & FEEL</MiniEyebrow>
		<h2>A different kind of light.</h2>
		<p>Warm paper for the daytime. A softer glow after dark.</p>
		<div class="theme-options">
			<button
				class:selected={app.theme === 'light'}
				aria-pressed={app.theme === 'light'}
				onclick={() => (app.theme = 'light')}
				><div class="theme-preview light-preview">
					<span></span><span></span><span></span><Sun size={25} />
				</div>
				<span
					>Daylight{#if app.theme === 'light'}<Check size={17} />{/if}</span
				></button
			><button
				class:selected={app.theme === 'dark'}
				aria-pressed={app.theme === 'dark'}
				onclick={() => (app.theme = 'dark')}
				><div class="theme-preview dark-preview">
					<span></span><span></span><span></span><Moon size={25} />
				</div>
				<span
					>After hours{#if app.theme === 'dark'}<Check size={17} />{/if}</span
				></button
			>
		</div>
		<div class="settings-divider"></div>
		<MiniEyebrow>ON THE BOARD</MiniEyebrow>
		<div class="setting-row">
			<div>
				<label for="coordinates">Board coordinates</label>
				<p>A little help finding your way around.</p>
			</div>
			<PreferenceSwitch id="coordinates" bind:checked={app.coordinates} />
		</div>
		<div class="setting-row">
			<div>
				<label for="evaluation">Evaluation bar</label>
				<p>See the balance of the position.</p>
			</div>
			<PreferenceSwitch id="evaluation" bind:checked={app.showEvaluation} />
		</div>
	</section>
	<aside class="settings-aside">
		<ShieldCheck size={26} />
		<h3>Your games. Your space.</h3>
		<p>
			Games and preferences are stored in this browser or app on this device. No account. No cloud
			sync.
		</p>
		<p>
			Clearing your browser or app data will remove your imports. Export any PGNs you want to keep.
		</p>
		<span class="private-note"><Check size={14} /> A quieter corner of the internet.</span>
	</aside>
</div>

<style>
	.private-note {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 5px;
		font-size: 9px;
		color: #9ba58a;
		margin-top: 16px;
	}
	@media (max-width: 760px) {
		.private-note {
			font-size: 10px;
		}
	}
	.settings-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(200px, 0.8fr);
		align-items: start;
		gap: 28px;
	}
	.settings-card {
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 31px;
	}
	.settings-card h2 {
		font-family: 'DM Serif Display', Georgia, serif;
		font-size: 29px;
		font-weight: 400;
		margin: 11px 0 10px;
	}
	.settings-card > p {
		font-size: 11px;
		line-height: 1.8;
		color: var(--muted);
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
		border-radius: 12px;
		padding: 5px;
	}
	.theme-options > button.selected {
		border-color: #9cae7d;
		box-shadow: 0 0 0 2px #a7b88926;
	}
	.theme-preview {
		height: 110px;
		position: relative;
		border-radius: 8px;
		padding: 17px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.light-preview {
		background: #f3efe2;
	}
	.dark-preview {
		background: #2a3025;
	}
	.theme-preview > span {
		height: 7px;
		background: #dedfcb;
		border-radius: 3px;
		width: 54%;
		display: block;
	}
	.theme-preview > span:nth-child(2) {
		width: 70%;
		height: 25px;
		background: #c1ceaa;
		margin-top: 3px;
	}
	.theme-preview > span:nth-child(3) {
		width: 40%;
		background: #e4cf80;
	}
	.dark-preview > span {
		background: #414a35;
	}
	.dark-preview > span:nth-child(2) {
		background: #798b62;
	}
	.dark-preview > span:nth-child(3) {
		background: #ad9b58;
	}
	.theme-preview > :global(svg) {
		position: absolute;
		right: 15px;
		bottom: 15px;
		color: #a79c68;
	}
	.theme-options > button > span {
		font-size: 11px;
		padding: 12px 7px 8px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.theme-options > button > span > :global(svg) {
		color: #8a9e6e;
	}
	.settings-divider {
		height: 1px;
		background: var(--line);
		margin: 30px 0;
	}
	.setting-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		margin-top: 26px;
	}
	.setting-row label {
		font-size: 12px;
		font-weight: 550;
	}
	.setting-row p {
		font-size: 10px;
		color: var(--muted);
		margin-top: 7px;
		line-height: 1.7;
	}
	.settings-aside {
		padding: 26px 16px;
		color: #9ea58f;
	}
	.settings-aside > :global(svg) {
		color: #9caf85;
	}
	.settings-aside h3 {
		font-family: 'DM Serif Display', Georgia, serif;
		color: #83916e;
		font-weight: 400;
		font-size: 23px;
		margin: 22px 0 15px;
	}
	.settings-aside > p {
		font-size: 11px;
		line-height: 1.9;
		margin-bottom: 13px;
	}
	.settings-aside .private-note {
		font-size: 8px;
		justify-content: flex-start;
		margin-top: 28px;
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.settings-layout {
			gap: 15px;
			grid-template-columns: minmax(0, 1.5fr) minmax(170px, 0.8fr);
		}
		.settings-card {
			padding: 23px;
		}
		.settings-aside {
			padding: 20px 6px;
		}
		.settings-card h2 {
			font-size: 25px;
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
		.settings-card {
			padding: 25px 22px;
		}
		.settings-card h2 {
			font-size: 28px;
		}
		.settings-card > p {
			font-size: 11px;
		}
		.theme-options {
			gap: 12px;
		}
		.theme-preview {
			height: 115px;
		}
		.theme-options > button > span {
			font-size: 12px;
		}
		.setting-row label {
			font-size: 13px;
		}
		.setting-row p {
			font-size: 11px;
		}
		.settings-aside {
			padding: 27px 12px;
		}
		.settings-aside h3 {
			font-size: 25px;
		}
		.settings-aside > p {
			font-size: 12px;
		}
		.settings-aside .private-note {
			font-size: 10px;
			margin-top: 20px;
		}
	}
	@media (min-width: 1001px) {
		.settings-card > p,
		.settings-aside > p {
			font-size: 12px;
		}
		.setting-row label {
			font-size: 13px;
		}
		.setting-row p {
			font-size: 11px;
		}
	}
</style>
