import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import App from '../src/App.svelte';

describe('App', () => {
	it('renders the heading', async () => {
		render(App);

		await expect.element(page.getByRole('heading', { name: 'Dent' })).toBeVisible();
	});

	it('renders formatter settings fieldset', async () => {
		render(App);

		await expect.element(page.getByRole('group', { name: 'Formatter settings' })).toBeVisible();
	});

	it('renders the Format button', async () => {
		render(App);

		await expect.element(page.getByRole('button', { name: 'Format' })).toBeVisible();
	});

	it('renders the Clear button', async () => {
		render(App);

		await expect.element(page.getByRole('button', { name: 'Clear' })).toBeVisible();
	});

	it('renders the Copy button as disabled initially', async () => {
		render(App);

		await expect.element(page.getByRole('button', { name: 'Copy' })).toBeDisabled();
	});

	it('renders the theme selector', async () => {
		render(App);

		await expect.element(page.getByRole('combobox', { name: 'Color theme' })).toBeVisible();
	});

	it('renders the auto-format checkbox checked by default', async () => {
		render(App);

		await expect.element(page.getByRole('checkbox', { name: 'Auto-format' })).toBeChecked();
	});

	it('renders both editor panes', async () => {
		render(App);

		await expect.element(page.getByLabelText('NSIS input editor')).toBeVisible();
		await expect.element(page.getByLabelText('Formatted output editor')).toBeVisible();
	});
});
