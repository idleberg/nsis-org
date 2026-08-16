import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Editor from '../src/Editor.svelte';

describe('Editor', () => {
	it('renders a container div with aria-label', async () => {
		render(Editor, {
			props: { label: 'Test editor' },
		});

		await expect.element(page.getByLabelText('Test editor')).toBeVisible();
	});

	it('calls oncreate with an EditorView instance', () => {
		const oncreate = vi.fn();

		render(Editor, {
			props: { label: 'Test editor', oncreate },
		});

		expect(oncreate).toHaveBeenCalledOnce();
		const view = oncreate.mock.calls[0]?.[0];
		expect(view).toBeDefined();
		expect(typeof view?.dispatch).toBe('function');
	});

	it('initialises with an empty document', () => {
		const oncreate = vi.fn();

		render(Editor, {
			props: { label: 'Test editor', oncreate },
		});

		const view = oncreate.mock.calls[0]?.[0];
		expect(view?.state.doc.toString()).toBe('');
	});

	it('initialises with the doc prop', () => {
		const oncreate = vi.fn();

		render(Editor, {
			props: { label: 'Test editor', doc: 'Name "Test"', oncreate },
		});

		const view = oncreate.mock.calls[0]?.[0];
		expect(view?.state.doc.toString()).toBe('Name "Test"');
	});
});
