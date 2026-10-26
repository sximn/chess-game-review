<script lang="ts">
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
		if (file.size > 500_000) {
			error = 'Please choose a PGN file smaller than 500 KB.';
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

<DialogFrame
	bind:open={app.importOpen}
	kind="import"
	title="Every game has a lesson."
	description="Bring yours along. Import a PGN to replay every move, at your own pace."
	closeLabel="Close import"
>
	{#snippet symbol()}<FileUp size={24} />{/snippet}
	<Tabs.Root value="paste"
		>{#snippet child({ props })}<div {...props} class="import-form">
				<TabList
					items={importTabs}
					variant="segmented"
					aria-label="Import method"
					class="segmented"
				/>
				<Tabs.Content value="paste">
					<label class="field-label" for="pgn">Game notation</label>
					<textarea
						id="pgn"
						bind:value={pgn}
						oninput={() => (error = '')}
						placeholder={'[White "Your name"]\n[Black "Opponent"]\n\n1. e4 e5 2. Nf3 Nc6 ...'}
						spellcheck="false"></textarea>
					<p class="field-hint">
						Export a game from Chess.com, Lichess, or your favorite chess app.
					</p>
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
							>{filename
								? 'Click to choose another file'
								: '.pgn · Up to 500 KB · One game at a time'}</span
						></button
					>
				</Tabs.Content>
				{#if error}<p class="form-error" role="alert">{error}</p>{/if}
				<Button fullWidth class="import-submit" onclick={submit}
					>Open game <ArrowUpRight size={18} /></Button
				>
				<div class="private-note"><Check size={14} /> Your games stay on this device.</div>
			</div>{/snippet}</Tabs.Root
	>
</DialogFrame>

<style>
	textarea {
		font-family: ui-monospace, monospace;
		width: 100%;
		min-height: 180px;
		resize: vertical;
		padding: 14px;
		background: var(--field);
		border: 1px solid var(--line);
		border-radius: 10px;
		color: var(--ink);
		font-size: 11px;
		line-height: 1.8;
	}
	.field-hint {
		font-size: 9px;
		line-height: 1.8;
		color: var(--muted);
		margin-top: 9px;
	}
	.private-note {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 5px;
		font-size: 9px;
		color: #9ba58a;
		margin-top: 16px;
	}
	textarea::placeholder {
		color: #a6ad98;
	}
	@media (max-width: 760px) {
		.field-hint {
			font-size: 10px;
		}
		.private-note {
			font-size: 10px;
		}
	}
	.field-label {
		display: block;
		font-size: 11px;
		font-weight: 600;
		margin-bottom: 9px;
	}
	.form-error {
		font-size: 11px;
		line-height: 1.7;
		padding: 12px;
		border: 1px solid #e3bbb0;
		background: #fff0e7;
		color: #a1543f;
		border-radius: 9px;
		margin-top: 14px;
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
	@media (max-width: 760px) {
		textarea {
			min-height: 170px;
			font-size: 12px;
		}
		.field-label {
			font-size: 12px;
		}
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
</style>
