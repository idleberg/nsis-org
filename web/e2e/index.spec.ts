import { expect, test } from '@playwright/test';
import { collectConsoleErrors, expectNoConsoleErrors } from './helpers.ts';

const demoPages = ['ace-mode', 'codemirror', 'dent', 'highlightjs', 'lumis', 'prismjs', 'textmate', 'twinkleplop'];

test('renders with links to all demos', async ({ page }) => {
	const errors = collectConsoleErrors(page);
	await page.goto('/');
	await expect(page).toHaveTitle(/nsis/i);

	for (const name of demoPages) {
		await expect(page.locator(`a[href*="${name}"]`)).toBeVisible();
	}

	expectNoConsoleErrors(errors);
});
