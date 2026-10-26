<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { Feather } from 'lucide-svelte';
	import type { Snippet } from 'svelte';
	import AppLogo from './AppLogo.svelte';
	import AppNavigation from './AppNavigation.svelte';
	import ImportDialog from './ImportDialog.svelte';
	import HelpDialog from './HelpDialog.svelte';
	import NoticeToast from './NoticeToast.svelte';
	import { app, hydrate, persistSettings } from '#lib/state.svelte.js';
	import { initializeNative, setNativeTheme } from '#lib/native.js';
	let { children }: { children: Snippet } = $props();
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
	<AppNavigation presentation="sidebar" review={page.url.pathname === '/'} />
	<div class="main-area">
		<header class="topbar">
			<div class="breadcrumb">
				<Feather size={16} /><span>Your chess corner</span><span class="breadcrumb-slash">/</span
				><strong
					>{page.url.pathname === '/games'
						? 'My games'
							: page.url.pathname === '/settings'
								? 'Preferences'
								: 'Game review'}</strong
				>
			</div>
			<a href="/" class="mobile-brand">
				<span class="brand-mark">
					<AppLogo size={26} />
				</span>
				<strong>Up a Pawn</strong>
			</a>
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
			<span>
				<Feather size={13} />
				Made for the love of the game
			</span>
		</footer>
	</div>
	<AppNavigation presentation="mobile" review={page.url.pathname === '/'} />
</div>
<ImportDialog />
<HelpDialog />
<NoticeToast />

<style>
	.app-layout {
		--sidebar-width: 226px;
		display: flex;
		min-height: 100dvh;
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
	.topbar-avatar {
		background: #f0e9da;
		color: #7a765c;
		display: grid;
		place-items: center;
		border: 1px solid #ded8c8;
		font-size: 12px;
		font-weight: 700;
	}
	.main-area {
		padding-left: 226px;
		width: 100%;
		min-width: 0;
	}
	.topbar {
		min-height: 76px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--line);
		padding: 0 40px;
	}
	.breadcrumb {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 10px;
		color: #9a9b8d;
	}
	.breadcrumb > :global(svg) {
		color: #919b80;
	}
	.breadcrumb strong {
		font-weight: 550;
		color: #666d5c;
	}
	.breadcrumb-slash {
		color: #c6c6b7;
		margin: 0 2px;
	}
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 22px;
	}
	.local-status {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 9px;
		color: #999d8e;
	}
	.local-status > span {
		height: 5px;
		width: 5px;
		background: #98ac80;
		border-radius: 50%;
	}
	.topbar-avatar {
		width: 30px;
		height: 30px;
		border-radius: 50%;
	}
	.mobile-brand {
		display: none;
	}
	main {
		max-width: 1220px;
		margin: 0 auto;
		padding: 34px 40px 0;
	}
	.app-footer {
		max-width: 1220px;
		padding: 24px 40px 22px;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		gap: 15px;
		font-size: 7px;
		color: #b2b6a3;
	}
	.app-footer > span {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	@media (hover: hover) {
		.topbar-avatar:hover {
			box-shadow: 0 0 0 3px #d9dfcc70;
		}
	}
	@media (min-width: 1500px) {
		main {
			padding-top: 42px;
		}
	}
	@media (max-width: 1200px) {
		.brand-mark {
			width: 35px;
			height: 39px;
		}
		.main-area {
			padding-left: 202px;
		}
		main {
			padding-left: 28px;
			padding-right: 28px;
		}
		.topbar {
			padding: 0 28px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.brand-mark {
			width: 31px;
			height: 36px;
		}
		.main-area {
			padding-left: 176px;
		}
		main {
			padding: 28px 21px 0;
		}
		.topbar {
			padding: 0 21px;
			min-height: 66px;
		}
		.local-status {
			display: none;
		}
	}
	@media (max-width: 760px) {
		.main-area {
			padding-left: 0;
		}
		.topbar {
			min-height: 69px;
			padding: calc(env(safe-area-inset-top, 0px) + 13px) max(20px, env(safe-area-inset-right, 0px))
				13px max(20px, env(safe-area-inset-left, 0px));
			background: var(--paper);
		}
		.breadcrumb,
		.local-status {
			display: none;
		}
		.mobile-brand {
			display: flex;
			gap: 9px;
			align-items: center;
			font-size: 19px;
			letter-spacing: -0.8px;
		}
		.mobile-brand > strong {
			font-weight: 750;
		}
		.mobile-brand .brand-mark {
			width: 31px;
			height: 34px;
			border-radius: 9px;
		}
		.topbar-avatar {
			width: 30px;
			height: 30px;
		}
		.topbar-right {
			gap: 0;
		}
		main {
			padding: 27px max(20px, env(safe-area-inset-right, 0px)) 0
				max(20px, env(safe-area-inset-left, 0px));
			max-width: 640px;
		}
		.app-footer {
			padding: 23px 20px calc(103px + env(safe-area-inset-bottom, 0px));
			font-size: 7px;
			justify-content: center;
		}
		.app-footer > span:last-child {
			display: none;
		}
	}
	@media (max-width: 360px) {
		main {
			padding-left: 15px;
			padding-right: 15px;
		}
	}
	:global(:root[data-theme='dark']) .topbar-avatar {
		background: #3b4233;
		border-color: #505943;
		color: #c6c9ab;
	}
	@media (min-width: 1001px) {
		main,
		.app-footer {
			max-width: 1120px;
		}
		.breadcrumb {
			font-size: 11px;
		}
		.local-status {
			font-size: 10px;
		}
	}
	@media (min-width: 761px) {
		.main-area {
			padding-top: env(safe-area-inset-top, 0px);
			padding-left: calc(var(--sidebar-width) + env(safe-area-inset-left, 0px));
			padding-right: env(safe-area-inset-right, 0px);
			padding-bottom: env(safe-area-inset-bottom, 0px);
		}
	}
	:global(html:has(.review-route)),
	:global(body:has(.review-route)) {
		height: 100%;
		overflow: hidden;
		overscroll-behavior: none;
	}
	.review-route {
		height: 100dvh;
		min-height: 0;
		overflow: hidden;
	}
	.review-route .topbar,
	.review-route .app-footer {
		display: none;
	}
	.review-route .main-area {
		height: 100%;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	.review-route main {
		flex: 1;
		min-height: 0;
		width: 100%;
		max-width: 1320px;
		padding: 16px 24px 12px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	@media (max-width: 760px) {
		.review-route .main-area {
			height: calc(100dvh - 66px - env(safe-area-inset-bottom, 0px));
		}
		.review-route main {
			padding: calc(12px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px))
				10px max(16px, env(safe-area-inset-left, 0px));
		}
	}
	@media (max-height: 520px) and (min-width: 480px) {
		.review-route main {
			padding: 8px 16px;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) and (max-width: 760px) {
		.review-route .main-area {
			height: 100dvh;
			padding-left: calc(56px + env(safe-area-inset-left, 0px));
			padding-right: env(safe-area-inset-right, 0px);
		}
	}
	@media (max-width: 1200px) {
		.app-layout {
			--sidebar-width: 202px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.app-layout {
			--sidebar-width: 176px;
		}
	}
	@media (max-height: 520px) and (min-width: 761px) {
		.review-route {
			--sidebar-width: 64px;
		}
	}
</style>
