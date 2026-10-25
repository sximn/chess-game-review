<script lang="ts">
	import { Switch } from 'bits-ui';
	import { ArrowLeft, Check, Moon, Sun, Monitor, Smartphone, ShieldCheck } from 'lucide-svelte';
	import { app } from '#lib/state.svelte.js';
</script>

<svelte:head><title>Preferences · Paper & Ink</title></svelte:head>
<div class="page-heading">
	<div>
		<div class="eyebrow"><span></span> MAKE YOURSELF AT HOME</div>
		<h1>Just your style<span class="heading-dot">.</span></h1>
		<p>A few small adjustments. A space that feels like you.</p>
	</div>
</div>
<div class="settings-layout">
	<section class="settings-card">
		<span class="mini-eyebrow">THE LOOK & FEEL</span>
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
		<span class="mini-eyebrow">ON THE BOARD</span>
		<div class="setting-row">
			<div>
				<label for="coordinates">Board coordinates</label>
				<p>A little help finding your way around.</p>
			</div>
			<Switch.Root id="coordinates" bind:checked={app.coordinates} class="switch"
				><Switch.Thumb class="switch-thumb" /></Switch.Root
			>
		</div>
		<div class="setting-row">
			<div>
				<label for="evaluation">Evaluation bar</label>
				<p>See the balance of the position.</p>
			</div>
			<Switch.Root id="evaluation" bind:checked={app.showEvaluation} class="switch"
				><Switch.Thumb class="switch-thumb" /></Switch.Root
			>
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
