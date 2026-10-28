<script lang="ts">
	import Field from './Field.svelte';
	import Textarea from './Textarea.svelte';
	import FieldMessage from './FieldMessage.svelte';
	import { Tabs } from 'bits-ui';
	import { ArrowUpRight, FileUp, FileText, Check, FolderOpen } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { app, addGame } from '#lib/state.svelte.js';
	import DialogFrame from './DialogFrame.svelte';
	import Button from './Button.svelte';
	import TabList from './TabList.svelte';
	import type { TabItem } from './tabs.types';
	const importTabs: TabItem[] = [
		{ value: 'paste', label: 'Paste PGN', icon: FileText },
		{ value: 'file', label: 'Upload file', icon: FolderOpen }
	];
	let pgn = $state('');
	let error = $state('');
	let filename = $state('');
	let fileInput: HTMLInputElement;
	async function readFile(file?: File) {
		if (!file) return;
		if (file.size > 1_048_576) {
			error = 'Please choose a PGN file no larger than 1 MiB.';
			return;
		}
		pgn = await file.text();
		filename = file.name;
		error = '';
	}
	function submit() {
		try {
			addGame(pgn);
			app.importOpen = false;
			pgn = '';
			filename = '';
			error = '';
			void goto(`/?game=${encodeURIComponent(app.currentId)}`);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
		}
	}
</script>

<DialogFrame bind:open={app.importOpen} kind="import" title="Import Game" closeLabel="Close import">
	{#snippet symbol()}<FileUp size={24} />{/snippet}
	<Tabs.Root value="paste">
		{#snippet child({ props })}
			<div {...props} class="import-form">
				<TabList
					items={importTabs}
					variant="segmented"
					aria-label="Import method"
					class="segmented"
				/>
				<Tabs.Content value="paste">
					{#snippet child({ props })}
						<Field {...props} controlId="pgn" label="Game notation">
							<Textarea
								monospace
								bind:value={pgn}
								oninput={() => (error = '')}
								aria-invalid={error ? true : undefined}
								aria-describedby={error ? 'import-error' : undefined}
								placeholder={'[White "Your name"]\n[Black "Opponent"]\n\n1. e4 e5 2. Nf3 Nc6 ...'}
								spellcheck="false"
								autocapitalize="off"
								autocorrect="off"
							/>
						</Field>
					{/snippet}
				</Tabs.Content>
				<Tabs.Content value="file">
					<input
						bind:this={fileInput}
						type="file"
						accept=".pgn,text/plain,application/x-chess-pgn"
						class="visually-hidden"
						onchange={(event) => readFile(event.currentTarget.files?.[0])}
					/>
					<button class="file-drop" onclick={() => fileInput.click()}
						><FileUp size={32} /><strong>{filename || 'Choose a PGN file'}</strong><span
							>{filename ? 'Click to choose another file' : '.pgn - Up to 1 MiB'}</span
						></button
					>
				</Tabs.Content>

				{#if error}
					<FieldMessage id="import-error" class="form-error" variant="error">{error}</FieldMessage>
				{/if}

				<Button fullWidth class="import-submit" onclick={submit}>
					Open game
					<ArrowUpRight size={18} />
				</Button>
			</div>
		{/snippet}
	</Tabs.Root>
</DialogFrame>

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
	.file-drop {
		display: flex;
		flex-direction: column;
		gap: 14px;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		border: 1px dashed #b7c0a0;
		border-radius: 12px;
		padding: 38px 12px;
		min-height: 230px;
		width: 100%;
		color: #95a17f;
	}
	.file-drop strong {
		font-size: 12px;
		color: var(--ink);
	}
	.file-drop span {
		font-size: 9px;
		color: var(--muted);
	}
	.import-form > :global(.segmented) {
		margin-bottom: 22px;
	}
	.import-form > :global(.import-submit) {
		margin-top: 22px;
	}
	@media (max-width: 760px) {
		.import-form > :global(.import-submit) {
			--button-min-height: 47px;
			--button-font-size: 13px;
		}
	}
	.import-form {
		--textarea-min-height: 180px;
		--textarea-font-size: 11px;
	}
	@media (max-width: 760px) {
		.import-form {
			--textarea-min-height: 170px;
			--textarea-font-size: 16px; /* Avoid iOS focusing zoom, which persists after closing the sheet. */
		}
	}
</style>
