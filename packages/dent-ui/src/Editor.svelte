<script lang="ts">
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { nsis } from '@nsis/codemirror';
import { onMount } from 'svelte';
import { darkTheme, editorTheme, lightTheme } from './themes.ts';

let {
	dark = true,
	doc = '',
	extensions = [],
	label = '',
	strict = false,
	oncreate,
}: {
	dark?: boolean;
	doc?: string;
	extensions?: Extension[];
	label?: string;
	strict?: boolean;
	oncreate?: (view: EditorView) => void;
} = $props();

let container: HTMLDivElement;
let view: EditorView | undefined;
const themeCompartment = new Compartment();
const langCompartment = new Compartment();

onMount(() => {
	view = new EditorView({
		state: EditorState.create({
			doc,
			extensions: [
				themeCompartment.of(dark ? darkTheme : lightTheme),
				langCompartment.of(nsis({ strict })),
				editorTheme,
				...extensions,
			],
		}),
		parent: container,
	});
	oncreate?.(view);
	return () => view?.destroy();
});

let initialized = false;
$effect(() => {
	const theme = dark ? darkTheme : lightTheme;
	if (initialized) {
		view?.dispatch({ effects: themeCompartment.reconfigure(theme) });
	}
	initialized = true;
});
</script>

<div bind:this={container} aria-label={label}></div>

<style>
	div {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}
	div :global(.cm-editor) {
		flex: 1;
		min-height: 0;
	}
</style>
