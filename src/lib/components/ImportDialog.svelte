<script lang="ts">
	import { Tabs } from 'bits-ui';
	import { ArrowUpRight, FileUp, FileText, Check, FolderOpen } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { app, addGame } from '#lib/state.svelte.js';
	import DialogFrame from './DialogFrame.svelte';
	import ActionButton from './ActionButton.svelte';
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
	<Tabs.Root value="paste">
		<Tabs.List
			>{#snippet child({ props })}<div {...props} class="segmented">
					<Tabs.Trigger value="paste"
						>{#snippet child({ props })}<button {...props}><FileText size={16} /> Paste PGN</button
							>{/snippet}</Tabs.Trigger
					><Tabs.Trigger value="file"
						>{#snippet child({ props })}<button {...props}
								><FolderOpen size={16} /> Upload file</button
							>{/snippet}</Tabs.Trigger
					>
				</div>{/snippet}</Tabs.List
		>
		<Tabs.Content value="paste">
			<label class="field-label" for="pgn">Game notation</label>
			<textarea
				id="pgn"
				bind:value={pgn}
				oninput={() => (error = '')}
				placeholder={'[White "Your name"]\n[Black "Opponent"]\n\n1. e4 e5 2. Nf3 Nc6 ...'}
				spellcheck="false"></textarea>
			<p class="field-hint">Export a game from Chess.com, Lichess, or your favorite chess app.</p>
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
	</Tabs.Root>
	{#if error}<p class="form-error" role="alert">{error}</p>{/if}
	<ActionButton presentation="import" onclick={submit}
		>Open game <ArrowUpRight size={18} /></ActionButton
	>
	<div class="private-note"><Check size={14} /> Your games stay on this device.</div>
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
	.segmented {
		display: flex;
		gap: 4px;
		background: var(--paper-deep);
		padding: 4px;
		border: 1px solid var(--line);
		border-radius: 11px;
		margin-bottom: 22px;
	}
	.segmented > button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		flex: 1;
		min-height: 36px;
		background: none;
		font-size: 11px;
		color: var(--muted);
		border-radius: 7px;
	}
	.segmented > button[data-state='active'] {
		background: var(--paper);
		box-shadow: 0 1px 3px #42461d16;
		color: var(--ink);
		font-weight: 650;
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
		.segmented > button {
			min-height: 40px;
			font-size: 12px;
		}
		.field-label {
			font-size: 12px;
		}
	}
</style>
