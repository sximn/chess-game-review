<script lang="ts">
	import { page } from '$app/state';
	import { BookOpen, CircleQuestionMark, LayoutGrid, Plus, Settings2 } from 'lucide-svelte';
	import AppLogo from './AppLogo.svelte';
	import Button from './Button.svelte';
	import { app } from '#lib/state.svelte.js';

	let {
		presentation,
		review = false
	}: {
		presentation: 'sidebar' | 'mobile';
		review?: boolean;
	} = $props();

	let pathname = $derived(
		page.url.pathname === '' || page.url.pathname === '/index.html' ? '/' : page.url.pathname
	);
	const links = [
		{ href: '/', label: 'Game review', icon: LayoutGrid },
		{ href: '/games', label: 'My games', icon: BookOpen }
	];
</script>

{#if presentation === 'sidebar'}
	<aside class="sidebar" class:review>
		<a href="/" class="brand" aria-label="Up a Pawn home">
			<span class="brand-mark"><AppLogo size={33} /></span>
			<span>
				Up
				<span class="brand-amp">a</span>
				Pawn
			</span>
		</a>

		<nav class="main-nav" aria-label="Main navigation">
			{#each links as link}<a
					href={link.href}
					aria-label={link.label}
					class:active={pathname === link.href}
					aria-current={pathname === link.href ? 'page' : undefined}
					><link.icon size={19} strokeWidth={1.7} /><span>{link.label}</span
					>{#if link.href === '/' && pathname === '/'}<span class="nav-dot"></span>{/if}</a
				>{/each}
		</nav>
		<Button class="sidebar-import" aria-label="Import game" onclick={() => (app.importOpen = true)}
			><Plus size={18} /> Import a game</Button
		>
		<div class="sidebar-bottom">
			<a class="sidebar-utility" href="/settings"><Settings2 size={18} /> Preferences</a>
			<button class="sidebar-utility" onclick={() => (app.helpOpen = true)}
				><CircleQuestionMark size={18} /> A little help</button
			>
			<div class="profile">
				<span class="profile-avatar">S</span>
				<div>
					<strong>Your chess reviews</strong>
				</div>
			</div>
		</div>
	</aside>
{:else}
	<nav class="mobile-nav" class:review aria-label="Mobile navigation">
		{#each links as link}<a
				href={link.href}
				aria-label={link.label}
				class:active={pathname === link.href}
				aria-current={pathname === link.href ? 'page' : undefined}
				><link.icon size={21} /><span
					>{link.href === '/' ? 'Review' : link.href === '/games' ? 'Games' : 'Insights'}</span
				></a
			>{/each}
		<button onclick={() => (app.importOpen = true)}><Plus size={22} /><span>Import</span></button>
	</nav>
{/if}

<style>
	.sidebar {
		width: 226px;
		position: fixed;
		inset: 0 auto 0 0;
		padding: 39px 21px 0;
		background: var(--paper);
		border-right: 1px solid var(--line);
		display: flex;
		flex-direction: column;
		z-index: 30;
	}
	.brand {
		display: flex;
		gap: 10px;
		align-items: center;
		font-size: 23px;
		letter-spacing: -1.2px;
		font-weight: 800;
		line-height: 1.1;
	}
	.brand-mark {
		width: 40px;
		height: 43px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(145deg, #ffe986, #ffd84d);
		border-radius: 12px;
		color: #32352a;
		border: 1px solid #e4bf43;
		box-shadow:
			inset 0 1px #fff8,
			0 3px 6px #4f420a0c;
	}
	.brand-amp {
		font-weight: 450;
		font-size: 19px;
		margin: 0 2px;
		color: #8b9279;
	}
	.main-nav {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-top: 12px;
	}
	.main-nav a {
		position: relative;
		min-height: 45px;
		border-radius: 11px;
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 13px;
		color: #828776;
		font-size: 12px;
		font-weight: 550;
		transition: background 0.18s;
	}
	.main-nav a.active {
		background: #edeedc;
		color: #4b6040;
		font-weight: 700;
		box-shadow: inset 0 0 0 1px #dce1ca;
	}
	.main-nav a.active :global(svg) {
		color: #627551;
	}
	.nav-dot {
		margin-left: auto;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #7e9a6c;
	}
	.sidebar-bottom {
		margin-top: auto;
	}
	.sidebar-utility {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 11px;
		min-height: 38px;
		padding: 0 13px;
		background: none;
		color: var(--muted);
		font-size: 11px;
		border-radius: 8px;
	}
	.profile {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 22px 0 24px;
		margin-top: 16px;
		border-top: 1px solid var(--line);
	}
	.profile-avatar {
		background: #f0e9da;
		color: #7a765c;
		display: grid;
		place-items: center;
		border: 1px solid #ded8c8;
		font-size: 12px;
		font-weight: 700;
	}
	.profile-avatar {
		width: 33px;
		height: 33px;
		border-radius: 50%;
	}
	.profile strong {
		display: block;
		font-size: 10px;
		font-weight: 650;
	}
	.profile > :global(svg) {
		color: #929b7c;
		margin-left: auto;
	}
	.mobile-nav {
		display: none;
	}
	@media (hover: hover) {
		.main-nav a:not(.active):hover,
		.sidebar-utility:hover {
			background: var(--bg);
			color: #778762;
		}
	}
	@media (max-width: 1200px) {
		.sidebar {
			width: 202px;
			padding-left: 16px;
			padding-right: 16px;
		}
		.brand {
			font-size: 21px;
		}
		.brand-mark {
			width: 35px;
			height: 39px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.sidebar {
			width: 176px;
			padding: 30px 12px 0;
		}
		.brand {
			font-size: 19px;
			gap: 7px;
		}
		.brand-mark {
			width: 31px;
			height: 36px;
		}
		.brand-mark > :global(svg) {
			width: 28px;
		}
		.main-nav a {
			font-size: 10px;
			gap: 9px;
			padding: 0 10px;
		}
		.profile strong {
			font-size: 8px;
		}
		.profile > :global(svg) {
			display: none;
		}
		.sidebar-utility {
			font-size: 10px;
		}
	}
	@media (max-width: 760px) {
		.sidebar {
			display: none;
		}
		.mobile-nav {
			display: flex;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			padding: 10px max(16px, env(safe-area-inset-right, 0px))
				calc(8px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px));
			background: color-mix(in srgb, var(--paper) 95%, transparent);
			border-top: 1px solid var(--line);
			backdrop-filter: blur(15px);
			z-index: 40;
			box-shadow: 0 -4px 20px #2d351a05;
		}
		.mobile-nav > a,
		.mobile-nav > button {
			display: flex;
			align-items: center;
			flex-direction: column;
			justify-content: center;
			gap: 5px;
			flex: 1;
			min-height: 47px;
			font-size: 9px;
			color: #a5ad96;
			background: none;
			font-weight: 550;
			position: relative;
		}
		.mobile-nav > .active {
			color: #72895a;
		}
		.mobile-nav > .active::before {
			content: '';
			position: absolute;
			top: -5px;
			width: 28px;
			height: 3px;
			background: #b5c795;
			border-radius: 5px;
		}
		.mobile-nav > button > :global(svg) {
			color: #7e8b67;
			background: var(--yellow);
			width: 25px;
			height: 25px;
			padding: 4px;
			border-radius: 7px;
			margin-top: -3px;
		}
		.mobile-nav > button > span {
			margin-top: -1px;
		}
	}
	:global(:root[data-theme='dark']) .main-nav a.active {
		background: #39472f;
		border-color: #4f6240;
		color: #c1d2ab;
		box-shadow: inset 0 0 0 1px #53664855;
	}
	:global(:root[data-theme='dark']) .profile-avatar {
		background: #3b4233;
		border-color: #505943;
		color: #c6c9ab;
	}
	@media (min-width: 1001px) {
		.main-nav a {
			font-size: 13px;
		}
		.sidebar-utility {
			font-size: 12px;
		}
	}
	@media (min-width: 761px) {
		.sidebar {
			top: env(safe-area-inset-top, 0px);
			left: env(safe-area-inset-left, 0px);
			bottom: env(safe-area-inset-bottom, 0px);
		}
	}
	@media (max-height: 520px) and (min-width: 761px) {
		.sidebar.review {
			width: 64px;
			padding: 10px;
		}
		.sidebar.review .brand {
			justify-content: center;
		}
		.sidebar.review .brand > span:last-child,
		.sidebar.review .profile {
			display: none;
		}
		.sidebar.review .main-nav {
			margin-top: 14px;
		}
		.sidebar.review .main-nav a {
			width: 44px;
			padding: 0;
			justify-content: center;
		}
		.sidebar.review .main-nav a > span {
			display: none;
		}
		.sidebar.review .sidebar-utility {
			font-size: 0;
			justify-content: center;
			gap: 0;
			padding: 0;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) and (max-width: 760px) {
		.mobile-nav.review {
			position: fixed;
			left: env(safe-area-inset-left, 0px);
			top: env(safe-area-inset-top, 0px);
			bottom: env(safe-area-inset-bottom, 0px);
			width: 56px;
			right: auto;
			flex-direction: column;
			justify-content: center;
			padding: 8px 4px;
			gap: 14px;
			border-top: 0;
			border-right: 1px solid var(--line);
		}
		.mobile-nav.review > a,
		.mobile-nav.review > button {
			flex: 0;
			min-height: 48px;
			width: 48px;
		}
		.mobile-nav.review > .active::before {
			top: auto;
			left: -4px;
			height: 24px;
			width: 3px;
		}
	}
	@media (max-width: 760px) {
		:global(.keyboard-open) .mobile-nav {
			display: none;
		}
	}

	.sidebar > :global(.sidebar-import) {
		margin: 24px 5px 0;
		--button-min-height: 42px;
		--button-gap: 8px;
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.sidebar > :global(.sidebar-import) {
			--button-padding: 0 10px;
			--button-font-size: 10px;
			margin-left: 0;
			margin-right: 0;
		}
	}
	@media (max-height: 520px) and (min-width: 761px) {
		.sidebar.review > :global(.sidebar-import) {
			--button-font-size: 0px;
			--button-width: 40px;
			--button-padding: 0;
			--button-gap: 0px;
			min-width: 0;
			margin: 14px 0 0;
		}
	}
</style>
