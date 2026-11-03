<!-- <script lang="ts">
	import { page } from '$app/state';
	import { BookOpen, CircleQuestionMark, LayoutGrid, Settings2 } from 'lucide-svelte';
	import AppLogo from './AppLogo.svelte';
	import { app } from '#lib/state.svelte.js';

	let {
		presentation,
		review = false,
	 }: {
		presentation: 'sidebar' | 'mobile';
		review?: boolean;
	} = $props();

	let reviewTab = $derived(page.url.pathname === '/review' || review);
	let links = $derived([
		{
			href: '/',
			label: 'My games',
			icon: BookOpen,
			active:
				!reviewTab && page.url.pathname !== '/settings' && page.url.pathname !== '/diagnostics'
		},
		{
			href: '/review',
			label: 'Review',
			icon: LayoutGrid,
			active: reviewTab
		},
		{
			href: '/settings',
			label: 'Preferences',
			icon: Settings2,
			active: page.url.pathname === '/settings'
		}
	]);
</script>

{#if presentation === 'sidebar'}
	<aside class="sidebar" class:review>
		<a href="/" class="brand" aria-label="Up a Pawn home">
			<span class="brand-mark"><AppLogo size={33} /></span>
			<span>Up <span class="brand-amp">a</span> Pawn</span>
		</a>
		<nav class="main-nav" aria-label="Main navigation">
			{#each links as link}
				<a
					href={link.href}
					aria-label={link.label}
					class:active={link.active}
					aria-current={link.active ? 'page' : undefined}
				>
					<link.icon size={19} strokeWidth={1.7} /><span>{link.label}</span>
				</a>
			{/each}
		</nav>
		<div class="sidebar-bottom">
			<button onclick={() => (app.helpOpen = true)}>
				<CircleQuestionMark size={18} />
				<span>Help</span>
			</button>
		</div>
	</aside>
{:else}
	<nav class="mobile-nav" class:review aria-label="Mobile navigation">
		{#each links as link}
			<a
				href={link.href}
				aria-label={link.label}
				class:active={link.active}
				aria-current={link.active ? 'page' : undefined}
			>
				<link.icon size={21} /><span>{link.label}</span>
			</a>
		{/each}
	</nav>
{/if}

<style>
	.sidebar {
		width: var(--sidebar-width);
		position: fixed;
		inset: 0 auto 0 0;
		padding: 36px 21px 22px;
		background: var(--paper);
		border-right: 1px solid var(--line);
		display: flex;
		flex-direction: column;
		z-index: 30;
	}
	/* The wordmark keeps its optical sizing and proportions at each breakpoint. */
	.brand {
		display: flex;
		gap: 10px;
		align-items: center;
		font-size: 23px;
		letter-spacing: -1.2px;
		font-weight: 800;
		line-height: 1.1;
		white-space: nowrap;
	}
	.brand-mark {
		width: 40px;
		height: 43px;
		display: grid;
		place-items: center;
		background: #151412;
		border-radius: 12px;
		border: 1px solid rgb(from var(--ink) r g b / 40%);
	}
	.brand-amp {
		font-weight: 450;
		font-size: 19px;
		color: var(--muted);
	}
	.main-nav {
		display: flex;
		flex-direction: column;
		gap: 7px;
		margin-top: 36px;
	}
	.main-nav a {
		min-height: 45px;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 13px;
		color: var(--muted);
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
	}
	.main-nav a.active {
		background: var(--active-bg);
		color: var(--active-text);
		font-weight: var(--weight-semibold);
		box-shadow: var(--active-shadow);
		border: 1px solid var(--active-border);
	}
	.main-nav a.active :global(svg) {
		color: var(--active-text);
	}
	.sidebar-bottom {
		margin-top: auto;
		padding-top: 24px;
	}
	.sidebar-bottom button {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 13px;
		width: 100%;
		background: none;
		color: var(--muted);
		font-size: var(--text-sm);
		border-radius: var(--radius-sm);
	}
	.mobile-nav {
		display: none;
	}
	@media (hover: hover) {
		.main-nav a:hover:not(.active),
		.sidebar-bottom button:hover {
			background: var(--surface-subtle);
		}
	}
	@media (max-width: 1200px) {
		.sidebar {
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
			padding: 30px 12px 20px;
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
			font-size: var(--text-sm);
			gap: 9px;
			padding: 0 10px;
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
		}
		.mobile-nav > a {
			display: flex;
			align-items: center;
			flex-direction: column;
			justify-content: center;
			gap: 5px;
			flex: 1;
			min-height: 47px;
			font-size: var(--text-caption);
			color: var(--muted);
			position: relative;
		}
		.mobile-nav > .active {
			color: var(--ink);
		}
		.mobile-nav > .active::before {
			content: '';
			position: absolute;
			top: -5px;
			width: 28px;
			height: 3px;
			background: var(--accent-strong);
			border-radius: var(--radius-xs);
		}
		:global(.keyboard-open) .mobile-nav {
			display: none;
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
		.sidebar.review .sidebar-bottom button span,
		.sidebar.review .main-nav a > span {
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
		.sidebar.review .sidebar-bottom button {
			padding: 12px 0;
			justify-content: center;
		}
	}
	@media (max-height: 520px) and (min-width: 480px) and (max-width: 760px) {
		.mobile-nav.review {
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
		.mobile-nav.review > a {
			flex: 0;
			min-height: 48px;
			width: 48px;
			font-size: 8px; /* Fit labels in the narrow landscape rail. */
		}
		.mobile-nav.review > .active::before {
			top: auto;
			left: -4px;
			height: 24px;
			width: 3px;
		}
	}
</style> -->
<script lang="ts">
	import { page } from '$app/state';
	import { BookOpen, CircleQuestionMark, LayoutGrid, Settings2 } from 'lucide-svelte';
	import AppLogo from './AppLogo.svelte';
	import { app } from '#lib/state.svelte.js';

	let {
		presentation,
		review = false
	}: {
		presentation: 'sidebar' | 'mobile';
		review?: boolean;
	} = $props();

	let reviewTab = $derived(page.url.pathname === '/review' || review);

	let links = $derived([
		{
			href: '/',
			label: 'My games',
			icon: BookOpen,
			active:
				!reviewTab &&
				page.url.pathname !== '/settings' &&
				page.url.pathname !== '/diagnostics'
		},
		{
			href: '/review',
			label: 'Review',
			icon: LayoutGrid,
			active: reviewTab
		},
		{
			href: '/settings',
			label: 'Preferences',
			icon: Settings2,
			active: page.url.pathname === '/settings'
		}
	]);

	function slidingIndicator(node: HTMLElement) {
		let frame = 0;
		let revealFrame = 0;
		let initialized = false;

		function measure() {
			const active = node.querySelector<HTMLAnchorElement>(
				'a[aria-current="page"]'
			);

			if (!active || !node.getClientRects().length || !active.offsetWidth) {
				delete node.dataset.indicatorReady;
				return;
			}

			// Both nav containers are positioned, so these coordinates are local.
			node.style.setProperty('--indicator-x', `${active.offsetLeft}px`);
			node.style.setProperty('--indicator-y', `${active.offsetTop}px`);
			node.style.setProperty('--indicator-width', `${active.offsetWidth}px`);
			node.style.setProperty('--indicator-height', `${active.offsetHeight}px`);
			node.dataset.indicatorReady = '';

			// Position the indicator before enabling its first transition.
			if (!initialized) {
				initialized = true;

				frame = requestAnimationFrame(() => {
					revealFrame = requestAnimationFrame(() => {
						node.dataset.indicatorAnimated = '';
					});
				});
			}
		}

		const resize = new ResizeObserver(measure);
		resize.observe(node);
		node.querySelectorAll('a').forEach((link) => resize.observe(link));

		const selection = new MutationObserver(measure);
		selection.observe(node, {
			subtree: true,
			attributes: true,
			attributeFilter: ['aria-current']
		});

		window.addEventListener('resize', measure);
		measure();

		return {
			destroy() {
				resize.disconnect();
				selection.disconnect();
				window.removeEventListener('resize', measure);
				cancelAnimationFrame(frame);
				cancelAnimationFrame(revealFrame);
			}
		};
	}
</script>

{#if presentation === 'sidebar'}
	<aside class="sidebar" class:review>
		<a href="/" class="brand" aria-label="Up a Pawn home">
			<span class="brand-mark"><AppLogo size={33} /></span>
			<span>Up <span class="brand-amp">a</span> Pawn</span>
		</a>

		<nav class="main-nav" aria-label="Main navigation" use:slidingIndicator>
			<span class="nav-indicator" aria-hidden="true"></span>

			{#each links as link (link.href)}
				<a
					href={link.href}
					aria-label={link.label}
					class:active={link.active}
					aria-current={link.active ? 'page' : undefined}
				>
					<link.icon size={19} strokeWidth={1.7} />
					<span>{link.label}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-bottom">
			<button onclick={() => (app.helpOpen = true)}>
				<CircleQuestionMark size={18} />
				<span>Help</span>
			</button>
		</div>
	</aside>
{:else}
	<nav
		class="mobile-nav"
		class:review
		aria-label="Mobile navigation"
		use:slidingIndicator
	>
		<span class="nav-indicator" aria-hidden="true"></span>

		{#each links as link (link.href)}
			<a
				href={link.href}
				aria-label={link.label}
				class:active={link.active}
				aria-current={link.active ? 'page' : undefined}
			>
				<link.icon size={21} />
				<span>{link.label}</span>
			</a>
		{/each}
	</nav>
{/if}

<style>
	.sidebar {
		width: var(--sidebar-width);
		position: fixed;
		inset: 0 auto 0 0;
		padding: 36px 21px 22px;
		background: var(--paper);
		border-right: 1px solid var(--line);
		display: flex;
		flex-direction: column;
		z-index: 30;
	}

	/* The wordmark keeps its optical sizing and proportions at each breakpoint. */
	.brand {
		display: flex;
		gap: 10px;
		align-items: center;
		font-size: 23px;
		letter-spacing: -1.2px;
		font-weight: 800;
		line-height: 1.1;
		white-space: nowrap;
	}

	.brand-mark {
		width: 40px;
		height: 43px;
		display: grid;
		place-items: center;
		background: #151412;
		border-radius: 12px;
		border: 1px solid rgb(from var(--ink) r g b / 40%);
	}

	.brand-amp {
		font-weight: 450;
		font-size: 19px;
		color: var(--muted);
	}

	.main-nav {
		display: flex;
		position: relative;
		isolation: isolate;
		flex-direction: column;
		gap: 7px;
		margin-top: 36px;
	}

	.main-nav a {
		box-sizing: border-box;
		position: relative;
		z-index: 1;
		min-height: 45px;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 13px;
		color: var(--muted);
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
	}

	.main-nav a.active {
		color: var(--active-text);
		font-weight: var(--weight-semibold);
	}

	.main-nav a.active :global(svg) {
		color: var(--active-text);
	}

	.nav-indicator {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		z-index: 0;
		visibility: hidden;
	}
	
	.main-nav:global([data-indicator-ready]) > .nav-indicator,
	.mobile-nav:global([data-indicator-ready]) > .nav-indicator {
		visibility: visible;
	}

	.main-nav:global([data-indicator-animated]) > .nav-indicator,
	.mobile-nav:global([data-indicator-animated]) > .nav-indicator {
		transition:
			transform 0.3s var(--ease),
			width 0.3s var(--ease),
			height 0.3s var(--ease);
	}

	.main-nav > .nav-indicator {
		box-sizing: border-box;
		width: var(--indicator-width, 0px);
		height: var(--indicator-height, 0px);
		transform: translate(
			var(--indicator-x, 0px),
			var(--indicator-y, 0px)
		);
		background: var(--active-bg);
		border: 1px solid var(--active-border);
		border-radius: var(--radius-md);
		box-shadow: var(--active-shadow);
	}

	.sidebar-bottom {
		margin-top: auto;
		padding-top: 24px;
	}

	.sidebar-bottom button {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 13px;
		width: 100%;
		background: none;
		color: var(--muted);
		font-size: var(--text-sm);
		border-radius: var(--radius-sm);
	}

	.mobile-nav {
		display: none;
		isolation: isolate;
	}

	.mobile-nav > .nav-indicator {
		width: 28px;
		height: 3px;
		background: var(--accent-strong);
		border-radius: var(--radius-xs);
		transform: translate(
			calc(var(--indicator-x, 0px) + var(--indicator-width, 0px) / 2 - 14px),
			calc(var(--indicator-y, 0px) - 5px)
		);
	}

	@media (hover: hover) {
		.main-nav a:hover:not(.active),
		.sidebar-bottom button:hover {
			background: var(--surface-subtle);
		}
	}

	@media (max-width: 1200px) {
		.sidebar {
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
			padding: 30px 12px 20px;
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
			font-size: var(--text-sm);
			gap: 9px;
			padding: 0 10px;
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
				calc(8px + env(safe-area-inset-bottom, 0px))
				max(16px, env(safe-area-inset-left, 0px));
			background: color-mix(in srgb, var(--paper) 95%, transparent);
			border-top: 1px solid var(--line);
			backdrop-filter: blur(15px);
			z-index: 40;
		}

		.mobile-nav > a {
			display: flex;
			align-items: center;
			flex-direction: column;
			justify-content: center;
			gap: 5px;
			flex: 1;
			min-height: 47px;
			font-size: var(--text-caption);
			color: var(--muted);
			position: relative;
			z-index: 1;
		}

		.mobile-nav > a.active {
			color: var(--ink);
		}

		:global(.keyboard-open) .mobile-nav {
			display: none;
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
		.sidebar.review .sidebar-bottom button span,
		.sidebar.review .main-nav a > span {
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

		.sidebar.review .sidebar-bottom button {
			padding: 12px 0;
			justify-content: center;
		}
	}

	@media (max-height: 520px) and (min-width: 480px) and (max-width: 760px) {
		.mobile-nav.review {
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

		.mobile-nav.review > a {
			flex: 0;
			min-height: 48px;
			width: 48px;
			font-size: 8px;
		}

		.mobile-nav.review > .nav-indicator {
			width: 3px;
			height: 24px;
			transform: translate(
				calc(var(--indicator-x, 0px) - 4px),
				calc(var(--indicator-y, 0px) + var(--indicator-height, 0px) / 2 - 12px)
			);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.main-nav:global([data-indicator-animated]) > .nav-indicator,
		.mobile-nav:global([data-indicator-animated]) > .nav-indicator {
			transition: none;
		}
	}
</style>