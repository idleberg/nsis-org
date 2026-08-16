import { expect, test } from '@playwright/test';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers.ts';

test('UI component renders', async ({ page }) => {
	const errors = collectConsoleErrors(page);
	await page.goto('/dent/');
	await expect(page.locator('#app')).not.toBeEmpty();
	expectNoConsoleErrors(errors);
});

test('formats the sample script on load', async ({ page }) => {
	const errors = collectConsoleErrors(page);
	await page.goto('/dent/');

	const inputEditor = page.locator('[aria-label="NSIS input editor"]');
	await expect(inputEditor.locator('.cm-content')).toContainText('requestExecutionLevel');

	const outputEditor = page.locator('[aria-label="Formatted output editor"]');
	await expect(outputEditor.locator('.cm-content')).toContainText('RequestExecutionLevel', { timeout: 5000 });

	expectNoConsoleErrors(errors);
});

test('formats ill-cased NSIS', async ({ page }) => {
	const errors = collectConsoleErrors(page);
	await page.goto('/dent/');

	const inputEditor = page.locator('[aria-label="NSIS input editor"]');
	await expect(inputEditor).toBeVisible();

	// The input starts seeded with the sample script — clear it so the
	// assertions below can only be satisfied by the typed text.
	await page.getByRole('button', { name: 'Clear' }).click();
	await expect(inputEditor.locator('.cm-content')).toHaveText('');

	await inputEditor.locator('.cm-content').click();
	await page.keyboard.type('SECTION "test"\nsectionend');

	const outputEditor = page.locator('[aria-label="Formatted output editor"]');
	await expect(outputEditor.locator('.cm-content')).not.toBeEmpty({ timeout: 5000 });

	const outputText = await outputEditor.locator('.cm-content').textContent();
	expect(outputText).toMatch(/Section/);
	expect(outputText).toMatch(/SectionEnd/);

	expectNoConsoleErrors(errors);
});
