import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import App from '../src/App.svelte';

describe('App', () => {
	it('renders the heading', async () => {
		render(App);

		await expect.element(page.getByRole('heading', { name: 'Ardent', exact: true })).toBeVisible();
	});

	it('names the heading after the engine', async () => {
		render(App, { engine: 'dent' });

		await expect.element(page.getByRole('heading', { name: 'Dent', exact: true })).toBeVisible();
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

	it('formats a seeded sample on mount, enabling Copy', async () => {
		render(App, {
			props: { sample: "name 'x'\nSection\nnop\nSectionEnd\n" },
		});

		await expect.element(page.getByRole('button', { name: 'Copy' })).toBeEnabled();
	});

	it('renders the comment style selector defaulting to preserve', async () => {
		render(App);

		await expect.element(page.getByRole('combobox', { name: 'Comments' })).toHaveValue('preserve');
	});

	it('rewrites comment markers when a comment style is picked', async () => {
		render(App, { props: { sample: '; hello\nSection\nnop\nSectionEnd\n' } });

		await page.getByRole('combobox', { name: 'Comments' }).selectOptions('hash');

		// toHaveTextContent matches the whole normalized text, so assert on the substring ourselves
		await expect.poll(() => page.getByLabelText('Formatted output editor').element().textContent).toContain('# hello');
	});

	it('renders both editor panes', async () => {
		render(App);

		await expect.element(page.getByLabelText('NSIS input editor')).toBeVisible();
		await expect.element(page.getByLabelText('Formatted output editor')).toBeVisible();
	});
});
