<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import {
		BookOpen,
		ChartNoAxesCombined,
		CircleQuestionMark,
		Feather,
		LayoutGrid,
		Plus,
		Settings2,
		TriangleAlert,
		Sprout,
		X
	} from 'lucide-svelte';
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import Knight from './Knight.svelte';
	import ImportDialog from './ImportDialog.svelte';
	import { app, hydrate, persistSettings } from '$lib/state.svelte';
	import { initializeNative, setNativeTheme } from '$lib/native';
	let { children }: { children: Snippet } = $props();
	const links = [
		{ href: '/', label: 'Game review', icon: LayoutGrid },
		{ href: '/games', label: 'My games', icon: BookOpen },
		{ href: '/insights', label: 'My insights', icon: ChartNoAxesCombined }
	];
	onMount(() => {
		hydrate();
		let disposed = false;
		let cleanup = () => {};
		void initializeNative()
			.then((remove) => {
				if (disposed) remove();
				else cleanup = remove;
			})
			.catch(console.warn);
		return () => {
			disposed = true;
			cleanup();
		};
	});
	$effect(() => {
		persistSettings();
		setNativeTheme(app.theme === 'dark');
	});
</script>

<div class="app-layout" class:review-route={page.url.pathname === '/'}>
	<aside class="sidebar">
		<a href="/" class="brand" aria-label="Paper and Ink home"
			><span class="brand-mark"><Knight size={33} /></span><span
				>paper<span class="brand-amp">&</span>ink<span class="brand-tagline"
					>A LITTLE WISER, EVERY GAME.</span
				></span
			></a
		>
		<div class="sidebar-label">YOUR CHESS CORNER</div>
		<nav class="main-nav" aria-label="Main navigation">
			{#each links as link}<a
					href={link.href}
					aria-label={link.label}
					class:active={page.url.pathname === link.href}
					aria-current={page.url.pathname === link.href ? 'page' : undefined}
					><link.icon size={19} strokeWidth={1.7} /><span>{link.label}</span
					>{#if link.href === '/' && page.url.pathname === '/'}<span class="nav-dot"></span>{/if}</a
				>{/each}
		</nav>
		<button
			class="button primary sidebar-import"
			aria-label="Import game"
			onclick={() => (app.importOpen = true)}><Plus size={18} /> Import a game</button
		>
		<div class="sidebar-bottom">
			<a class="sidebar-utility" href="/settings"><Settings2 size={18} /> Preferences</a>
			<button class="sidebar-utility" onclick={() => (app.helpOpen = true)}
				><CircleQuestionMark size={18} /> A little help</button
			>
			<div class="profile">
				<span class="profile-avatar">S</span>
				<div><strong>Your chess corner</strong><span>Just for the love of it</span></div>
				<Sprout size={19} />
			</div>
		</div>
	</aside>
	<div class="main-area">
		<header class="topbar">
			<div class="breadcrumb">
				<Feather size={16} /><span>Your chess corner</span><span class="breadcrumb-slash">/</span
				><strong
					>{page.url.pathname === '/games'
						? 'My games'
						: page.url.pathname === '/insights'
							? 'My insights'
							: page.url.pathname === '/settings'
								? 'Preferences'
								: 'Game review'}</strong
				>
			</div>
			<a href="/" class="mobile-brand"
				><span class="brand-mark"><Knight size={26} /></span><strong>paper & ink</strong></a
			>
			<div class="topbar-right">
				<span class="local-status"><span></span> Your own little space</span><a
					class="topbar-avatar"
					aria-label="Open preferences"
					href="/settings">S</a
				>
			</div>
		</header>
		<main id="main-content">{@render children()}</main>
		<footer class="app-footer">
			<span><Feather size={13} /> Made for the love of the game.</span><span
				>A little reflection goes a long way.</span
			>
		</footer>
	</div>
	<nav class="mobile-nav" aria-label="Mobile navigation">
		{#each links as link}<a
				href={link.href}
				aria-label={link.label}
				class:active={page.url.pathname === link.href}
				aria-current={page.url.pathname === link.href ? 'page' : undefined}
				><link.icon size={21} /><span
					>{link.href === '/' ? 'Review' : link.href === '/games' ? 'Games' : 'Insights'}</span
				></a
			>{/each}
		<button onclick={() => (app.importOpen = true)}><Plus size={22} /><span>Import</span></button>
	</nav>
</div>
<ImportDialog />
<Dialog.Root bind:open={app.helpOpen}>
	<Dialog.Portal
		><Dialog.Overlay class="dialog-overlay" /><Dialog.Content class="dialog-content">
			<div class="dialog-top">
				<span class="dialog-symbol"><CircleQuestionMark size={24} /></span><Dialog.Close
					class="icon-button"
					aria-label="Close help"><X size={20} /></Dialog.Close
				>
			</div>
			<Dialog.Title class="dialog-title">Make yourself at home.</Dialog.Title>
			<Dialog.Description class="dialog-description"
				>A few small things to help you find your way.</Dialog.Description
			>
			<div class="help-item">
				<span>← →</span>
				<p>
					<strong>One move at a time</strong>Use your arrow keys or the controls below the board.
				</p>
			</div>
			<div class="help-item">
				<span>Space</span>
				<p><strong>Sit back and watch</strong>Play or pause the game automatically.</p>
			</div>
			<div class="help-item">
				<span>PGN</span>
				<p>
					<strong>Bring your own game</strong>Paste notation or upload a .pgn file. Games are saved
					on this device.
				</p>
			</div>
			<p class="sample-notice">
				The Opera Game includes illustrative review data. Imported games support replay; engine
				analysis is a future addition.
			</p>
		</Dialog.Content></Dialog.Portal
	>
</Dialog.Root>
{#if app.notice}<div class="toast" role="status"><TriangleAlert size={16} />{app.notice}</div>{/if}
