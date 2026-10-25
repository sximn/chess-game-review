<script lang="ts">
	import { Dialog, Tabs } from 'bits-ui';
	import { ArrowUpRight, FileUp, FileText, X, Check, FolderOpen } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { app, addGame } from '#lib/state.svelte.js';
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

<Dialog.Root bind:open={app.importOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="dialog-content import-dialog">
			<div class="dialog-handle"></div>
			<div class="dialog-top">
				<span class="dialog-symbol"><FileUp size={24} /></span><Dialog.Close
					class="icon-button"
					aria-label="Close import"><X size={20} /></Dialog.Close
				>
			</div>
			<Dialog.Title class="dialog-title">Every game has a lesson.</Dialog.Title>
			<Dialog.Description class="dialog-description"
				>Bring yours along. Import a PGN to replay every move, at your own pace.</Dialog.Description
			>
			<Tabs.Root value="paste">
				<Tabs.List class="segmented"
					><Tabs.Trigger value="paste"><FileText size={16} /> Paste PGN</Tabs.Trigger><Tabs.Trigger
						value="file"><FolderOpen size={16} /> Upload file</Tabs.Trigger
					></Tabs.List
				>
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
			</Tabs.Root>
			{#if error}<p class="form-error" role="alert">{error}</p>{/if}
			<button class="button primary full" onclick={submit}
				>Open game <ArrowUpRight size={18} /></button
			>
			<div class="private-note"><Check size={14} /> Your games stay on this device.</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
