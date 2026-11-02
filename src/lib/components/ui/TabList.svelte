<script lang="ts">
	import { onMount } from 'svelte';
	import { Tabs } from 'bits-ui';
	import type { TabItem } from './tabs.types';

	let {
		items,
		variant = 'line',
		size = 'default',
		class: className,
		...props
	}: Omit<Tabs.ListProps, 'child' | 'children'> & {
		items: readonly TabItem[];
		variant?: 'line' | 'segmented';
		size?: 'default' | 'comfortable';
	} = $props();
	let list = $state<HTMLDivElement>();
	let indicator = $state<{ left: number; top: number; width: number; height: number }>();

	onMount(() => {
		if (!list) return;
		const element = list;
		function measure() {
			const active = element.querySelector<HTMLButtonElement>('[role="tab"][data-state="active"]');
			if (!active) {
				indicator = undefined;
				return;
			}
			const bounds = active.getBoundingClientRect();
			const host = element.getBoundingClientRect();
			const styles = getComputedStyle(active);
			const width = parseFloat(styles.width),
				height = parseFloat(styles.height);
			if (!width || !height || !bounds.width || !bounds.height) return;
			// Convert viewport measurements back to local pixels, including during dialog scale animations.
			const next = {
				left:
					(bounds.left - host.left) / (bounds.width / width) -
					element.clientLeft +
					element.scrollLeft,
				top:
					(bounds.top - host.top) / (bounds.height / height) -
					element.clientTop +
					element.scrollTop,
				width,
				height
			};
			if (
				!indicator ||
				Object.keys(next).some(
					(key) => next[key as keyof typeof next] !== indicator?.[key as keyof typeof next]
				)
			)
				indicator = next;
		}
		const resize = new ResizeObserver(measure);
		function observeTriggers() {
			resize.disconnect();
			resize.observe(element);
			element.querySelectorAll('[role="tab"]').forEach((trigger) => resize.observe(trigger));
			measure();
		}
		// Bits UI owns selection. Observe its state for mouse, keyboard, and programmatic updates alike.
		const selection = new MutationObserver((records) => {
			if (records.some((record) => record.type === 'childList')) observeTriggers();
			else measure();
		});
		selection.observe(element, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ['data-state']
		});
		observeTriggers();
		return () => {
			selection.disconnect();
			resize.disconnect();
		};
	});
</script>

<Tabs.List {...props}>
	{#snippet child({ props: listProps })}
		<div
			{...listProps}
			bind:this={list}
			class={['tab-list', className]}
			data-variant={variant}
			data-size={size}
		>
			<span
				class="tab-indicator"
				aria-hidden="true"
				style:visibility={indicator ? 'visible' : 'hidden'}
				style:width={indicator ? `${indicator.width}px` : '0px'}
				style:height={indicator ? `${indicator.height}px` : '0px'}
				style:transform={`translate(${indicator?.left ?? 0}px, ${indicator?.top ?? 0}px)`}
			></span>
			{#each items as item (item.value)}
				<Tabs.Trigger value={item.value} disabled={item.disabled}>
					{#snippet child({ props: triggerProps })}
						<button {...triggerProps} class="tab-trigger">
							{#if item.icon}<item.icon
									size={16}
									style="width:var(--tabs-icon-size);height:var(--tabs-icon-height,16px)"
								/>{/if}
							{item.label}
						</button>
					{/snippet}
				</Tabs.Trigger>
			{/each}
		</div>
	{/snippet}
</Tabs.List>

<style>
	.tab-list {
		--tabs-icon-size: 13px;
		--tabs-icon-height: 15px;
		display: flex;
		position: relative;
		isolation: isolate;
		padding: 6px;
		border-bottom: 1px solid var(--line);
		gap: 3px;
	}
	.tab-trigger {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		min-width: var(--tabs-min-width, auto);
		min-height: 35px;
		padding: var(--tabs-trigger-padding, 2px 6px);
		gap: 6px;
		background: none;
		color: #969b88;
		border-radius: 8px;
		font-size: 10px;
		white-space: nowrap;
	}
	.tab-trigger[data-state='active'] {
		background: transparent;
		color: var(--tabs-active-color, #626b50);
		font-weight: 700;
		box-shadow: none;
	}
	.tab-indicator {
		position: absolute;
		top: 0;
		left: 0;
		border-radius: 8px;
		background: var(--tabs-indicator-background, var(--paper-deep));
		border: 1px solid color-mix(in srgb, var(--sage) 26%, var(--line));
		box-shadow:
			inset 0 1px #ffffff80,
			0 1px 3px #42370a0a;
		transition: transform 0.3s var(--ease);
		pointer-events: none;
		z-index: -1;
	}
	@media (min-width: 1001px) {
		.tab-trigger {
			font-size: 11px;
		}
	}
	@media (max-width: 1000px) and (min-width: 761px) {
		.tab-list {
			--tabs-icon-size: 11px;
			padding: 5px;
			gap: 1px;
		}
		.tab-trigger {
			font-size: 8px;
			gap: 4px;
		}
	}
	@media (max-width: 760px) {
		.tab-list {
			--tabs-icon-size: 15px;
		}
		.tab-trigger {
			font-size: 11px;
			min-height: 44px;
			gap: 7px;
		}
	}
	.tab-list[data-size='comfortable'] .tab-trigger {
		min-height: 42px;
		font-size: 11px;
	}
	.tab-list[data-variant='segmented'] {
		--tabs-icon-size: 16px;
		--tabs-icon-height: 16px;
		--tabs-indicator-background: var(--paper);
		background: var(--paper-deep);
		padding: 4px;
		gap: 4px;
		border: 1px solid var(--line);
		border-radius: 11px;
	}
	.tab-list[data-variant='segmented'] .tab-trigger {
		min-height: 36px;
		font-size: 11px;
		gap: 7px;
		border-radius: 7px;
		color: var(--muted);
	}
	.tab-list[data-variant='segmented'] .tab-trigger[data-state='active'] {
		color: var(--ink);
		font-weight: 650;
	}
	.tab-list[data-variant='segmented'] .tab-indicator {
		border-radius: 7px;
	}
	@media (max-width: 760px) {
		.tab-list[data-variant='segmented'] .tab-trigger {
			min-height: 40px;
			font-size: 12px;
		}
	}
	:global(:root[data-theme='dark']) .tab-trigger[data-state='active'] {
		color: var(--tabs-dark-active-color, #c6cdb5);
	}
	:global(:root[data-theme='dark'])
		.tab-list[data-variant='segmented']
		.tab-trigger[data-state='active'] {
		color: var(--ink);
	}
	@media (prefers-reduced-motion: reduce) {
		.tab-indicator {
			transition: none;
		}
	}
</style>
