<script lang="ts">
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { indentOnInput } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { createFormatter } from '@nsis/dent';
import { onDestroy, onMount } from 'svelte';
import Editor from './Editor.svelte';

let { strict = false, sample = '' }: { strict?: boolean; sample?: string } = $props();

let dark = $state(document.documentElement.dataset.theme !== 'light');
let themePreference = $state(localStorage.getItem('theme') || 'system');

let useTabs = $state(true);
let singleQuote = $state(false);
let trimEmptyLines = $state(true);
let indentSize = $state(2);
let printWidth = $state(120);
let endOfLine = $state<'lf' | 'crlf'>('lf');
let commentStyle = $state<'preserve' | 'hash' | 'semi'>('preserve');
let autoFormat = $state(true);

let status = $state('');
let error = $state('');
let hasOutput = $state(false);
let inputView: EditorView | undefined;
let outputView: EditorView | undefined;
let debounceTimer: ReturnType<typeof setTimeout>;
let statusTimer: ReturnType<typeof setTimeout>;

const mql = matchMedia('(prefers-color-scheme: light)');
function handleColorSchemeChange() {
	if (themePreference === 'system') applyTheme('system');
}

onMount(() => {
	mql.addEventListener('change', handleColorSchemeChange);

	// Child editors have mounted by now, so both views exist. CodeMirror's
	// updateListener doesn't fire for the initial document, which means a
	// seeded input never triggers the auto-format path on its own.
	if (sample) formatInput();

	return () => mql.removeEventListener('change', handleColorSchemeChange);
});

onDestroy(() => {
	clearTimeout(debounceTimer);
	clearTimeout(statusTimer);
});

function applyTheme(pref: string) {
	const isLight = pref === 'light' || (pref === 'system' && mql.matches);
	if (isLight) {
		document.documentElement.dataset.theme = 'light';
	} else {
		delete document.documentElement.dataset.theme;
	}
	localStorage.setItem('theme', pref);
	dark = !isLight;
}

applyTheme(localStorage.getItem('theme') || 'system');

function scheduleAutoFormat() {
	if (!autoFormat) return;
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(formatInput, 400);
}

function formatInput() {
	error = '';
	const source = inputView?.state.doc.toString() ?? '';

	if (!source.trim()) {
		setOutput('');
		return;
	}

	try {
		const { format } = createFormatter({
			useTabs,
			singleQuote,
			trimEmptyLines,
			indentSize,
			printWidth,
			endOfLine,
			commentStyle: commentStyle === 'preserve' ? undefined : commentStyle,
		});
		setOutput(format(source));
		clearTimeout(statusTimer);
		status = 'Formatted';
		statusTimer = setTimeout(() => {
			status = '';
		}, 1500);
	} catch (err) {
		error = err instanceof Error ? err.message : String(err);
	}
}

function setOutput(text: string) {
	if (!outputView) return;
	outputView.dispatch({
		changes: { from: 0, to: outputView.state.doc.length, insert: text },
	});
	hasOutput = !!text.trim();
}

async function copyOutput() {
	const text = outputView?.state.doc.toString() ?? '';
	if (!text.trim()) return;
	await navigator.clipboard.writeText(text);
	clearTimeout(statusTimer);
	status = 'Copied';
	statusTimer = setTimeout(() => {
		status = '';
	}, 1500);
}

function clear() {
	clearTimeout(debounceTimer);
	if (inputView) {
		inputView.dispatch({
			changes: { from: 0, to: inputView.state.doc.length, insert: '' },
		});
	}
	setOutput('');
	error = '';
	status = '';
}

const inputExtensions = [
	history(),
	keymap.of([...defaultKeymap, ...historyKeymap]),
	indentOnInput(),
	EditorView.lineWrapping,
	EditorView.updateListener.of((update) => {
		if (update.docChanged) scheduleAutoFormat();
	}),
];

const outputExtensions = [EditorState.readOnly.of(true), EditorView.lineWrapping];
</script>

<header>
	<h1>Dent</h1>
	<fieldset class="settings" aria-label="Formatter settings">
		<label
			><input
				type="checkbox"
				bind:checked={useTabs}
				onchange={scheduleAutoFormat}
			/> Tabs</label
		>
		<label
			><input
				type="checkbox"
				bind:checked={singleQuote}
				onchange={scheduleAutoFormat}
			/> Single quotes</label
		>
		<label
			><input
				type="checkbox"
				bind:checked={trimEmptyLines}
				onchange={scheduleAutoFormat}
			/> Trim empty lines</label
		>
		<label>
			Indent
			<select bind:value={indentSize} onchange={scheduleAutoFormat}>
				<option value={2}>2</option>
				<option value={4}>4</option>
				<option value={8}>8</option>
			</select>
		</label>
		<label>
			Width
			<input
				type="number"
				bind:value={printWidth}
				onchange={scheduleAutoFormat}
				min="40"
				max="320"
				step="10"
			/>
		</label>
		<label>
			EOL
			<select bind:value={endOfLine} onchange={scheduleAutoFormat}>
				<option value="lf">LF</option>
				<option value="crlf">CRLF</option>
			</select>
		</label>
		<label>
			Comments
			<select bind:value={commentStyle} onchange={scheduleAutoFormat}>
				<option value="preserve">Preserve</option>
				<option value="hash">Hash</option>
				<option value="semi">Semicolon</option>
			</select>
		</label>
	</fieldset>
	<select
		class="theme-select"
		aria-label="Color theme"
		bind:value={themePreference}
		onchange={() => applyTheme(themePreference)}
	>
		<option value="system">System</option>
		<option value="light">Light</option>
		<option value="dark">Dark</option>
	</select>
</header>

<div class="editors">
	<div class="editor-pane">
		<div class="pane-header">Input</div>
		<Editor
			{dark}
			{strict}
			doc={sample}
			extensions={inputExtensions}
			label="NSIS input editor"
			oncreate={(v) => {
				inputView = v;
				v.focus();
			}}
		/>
	</div>
	<div class="editor-pane">
		<div class="pane-header">Output</div>
		<Editor
			{dark}
			{strict}
			extensions={outputExtensions}
			label="Formatted output editor"
			oncreate={(v) => (outputView = v)}
		/>
	</div>
</div>

<footer>
	<button class="btn-primary" onclick={formatInput}>Format</button>
	<button class="btn-secondary" onclick={clear}>Clear</button>
	<label class="auto-label">
		<input type="checkbox" bind:checked={autoFormat} /> Auto-format
	</label>
	{#if status}
		<span class="status" role="status" aria-live="polite">{status}</span>
	{/if}
	{#if error}
		<span class="error" role="alert">{error}</span>
	{/if}
	<button
		class="btn-secondary copy-btn"
		onclick={copyOutput}
		disabled={!hasOutput}>Copy</button
	>
</footer>

<style>
	:global(:root) {
		--bg: #1e1e2e;
		--surface: #313244;
		--overlay: #45475a;
		--text: #cdd6f4;
		--subtext: #a6adc8;
		--blue: #89b4fa;
		--mauve: #cba6f7;
		--red: #f38ba8;
		--green: #a6e3a1;
		--border: #585b70;
		--radius: 6px;
	}

	:global([data-theme="light"]) {
		--bg: #eff1f5;
		--surface: #e6e9ef;
		--overlay: #ccd0da;
		--text: #4c4f69;
		--subtext: #6c6f85;
		--blue: #1e66f5;
		--mauve: #8839ef;
		--red: #d20f39;
		--green: #40a02b;
		--border: #bcc0cc;
	}

	:global(*) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
			"Helvetica Neue", sans-serif;
		background: var(--bg);
		color: var(--text);
		height: 100vh;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		-webkit-user-select: none;
		user-select: none;
	}

	:global(#app) {
		display: contents;
	}

	header {
		padding: 12px 16px;
		display: flex;
		align-items: center;
		gap: 16px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	header h1 {
		font-size: 16px;
		font-weight: 600;
		color: var(--blue);
	}

	.settings {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		font-size: 13px;
		border: none;
		padding: 0;
	}

	.settings label {
		display: flex;
		align-items: center;
		gap: 5px;
		color: var(--subtext);
		cursor: pointer;
	}

	.settings input[type="checkbox"] {
		accent-color: var(--blue);
	}

	.settings select,
	.settings input[type="number"] {
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 3px 6px;
		font-size: 13px;
		font-family: inherit;
	}

	.settings input[type="number"] {
		width: 70px;
	}

	.theme-select {
		margin-left: auto;
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 3px 6px;
		font-size: 12px;
		font-family: inherit;
		cursor: pointer;
	}

	.editors {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		min-height: 0;
	}

	.editor-pane {
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.editor-pane :global(.cm-content) {
		-webkit-user-select: text;
		user-select: text;
	}

	.editor-pane:first-child {
		border-right: 1px solid var(--border);
	}

	.pane-header {
		padding: 8px 12px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--subtext);
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	footer {
		padding: 8px 16px;
		padding-bottom: max(8px, env(safe-area-inset-bottom));
		display: flex;
		align-items: center;
		gap: 12px;
		border-top: 1px solid var(--border);
		flex-shrink: 0;
	}

	button {
		font-family: inherit;
		font-size: 13px;
		font-weight: 500;
		padding: 5px 14px;
		border-radius: var(--radius);
		border: 1px solid transparent;
		cursor: pointer;
		transition: background 0.15s;
	}

	.btn-primary {
		background: var(--blue);
		color: var(--bg);
	}
	.btn-primary:hover {
		filter: brightness(1.1);
	}

	.btn-secondary {
		background: var(--surface);
		color: var(--text);
		border-color: var(--border);
	}
	.btn-secondary:hover {
		background: var(--overlay);
	}

	.status {
		font-size: 12px;
		color: var(--green);
	}

	.error {
		font-size: 12px;
		color: var(--red);
	}

	.copy-btn {
		margin-left: auto;
	}

	.auto-label {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 13px;
		color: var(--subtext);
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	button:focus-visible,
	select:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--mauve);
		outline-offset: 2px;
	}
</style>
