import { expect, test } from '@playwright/test';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers.ts';

test('highlights syntax', async ({ page }) => {
	const errors = collectConsoleErrors(page);
	await page.goto('/twinkleplop/');

	const output = page.locator('#output');
	await expect(output.locator('pre.twinkleplop')).toBeVisible();
	await expect(output.locator('span.tok.keyword')).not.toHaveCount(0);

	expectNoConsoleErrors(errors);
});
