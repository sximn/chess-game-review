<script lang="ts">
	import Button from '#lib/components/Button.svelte';
	import { DropdownMenu } from 'bits-ui';
	import { Download, Ellipsis, Lightbulb, Settings2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { app } from '#lib/state.svelte.js';

	let {
		onExport
	}: {
		onExport: () => void;
	} = $props();
</script>

<DropdownMenu.Root bind:open={app.menuOpen}>
	<DropdownMenu.Trigger aria-label="Game actions">
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="icon-button game-actions"
				style="flex-shrink:0"
			>
				<Ellipsis size={22} />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Portal>
		<DropdownMenu.Content>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					<div {...props} class="dropdown-menu">
						<DropdownMenu.Item onclick={onExport}>
							{#snippet child({ props })}
								<div {...props}><Download size={15} /> Export PGN</div>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => goto('/settings')}>
							{#snippet child({ props })}
								<div {...props}><Settings2 size={15} /> Preferences</div>
							{/snippet}
						</DropdownMenu.Item>
						<DropdownMenu.Item onclick={() => (app.helpOpen = true)}>
							{#snippet child({ props })}
								<div {...props}><Lightbulb size={15} /> How this review works</div>
							{/snippet}
						</DropdownMenu.Item>
					</div>
				</div>
			{/snippet}
		</DropdownMenu.Content>
	</DropdownMenu.Portal>
</DropdownMenu.Root>

<style>
	.dropdown-menu {
		min-width: 230px;
		z-index: 60;
		padding: 5px;
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: 11px;
		box-shadow: 0 8px 32px #2b331626;
	}
	.dropdown-menu [role='menuitem'] {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 12px;
		font-size: 11px;
		color: var(--muted);
		border-radius: 7px;
		cursor: pointer;
		outline: 0;
	}
	.dropdown-menu [data-highlighted] {
		background: var(--paper-deep);
		color: var(--ink);
	}
</style>
