import type { LanguageRegistration } from 'shiki';
import { describe, expect, it } from 'vitest';
import grammar from '../src/index.ts';

describe('TextMate Grammar', () => {
	it('should export a valid grammar object', () => {
		expect(grammar).toBeDefined();
		expect(grammar.scopeName).toBe('source.nsis');
		expect(grammar.name).toBe('NSIS');
	});

	it('should have patterns', () => {
		expect(grammar.patterns).toBeInstanceOf(Array);
		expect(grammar.patterns.length).toBeGreaterThan(0);
	});

	it('should have file types', () => {
		expect(grammar.fileTypes).toContain('nsi');
		expect(grammar.fileTypes).toContain('nsh');
	});
});

describe('Shiki Integration', () => {
	it('should work with shiki', async () => {
		const { createHighlighter } = await import('shiki');
		const highlighter = await createHighlighter({
			themes: ['nord'],
			langs: [
				{
					...grammar,
					name: 'nsis',
				},
			] as LanguageRegistration[],
		});

		const html = highlighter.codeToHtml('Name "Example"', {
			lang: 'nsis',
			theme: 'nord',
		});

		expect(html).toContain('Example');
		expect(html).toContain('<pre');

		highlighter.dispose();
	});

	it('should scope else conditions as part of the directive', async () => {
		const { createHighlighter } = await import('shiki');
		const highlighter = await createHighlighter({
			themes: ['nord'],
			langs: [
				{
					...grammar,
					name: 'nsis',
				},
			] as LanguageRegistration[],
		});

		for (const condition of ['if', 'ifdef', 'ifndef', 'ifmacrodef', 'ifmacrondef']) {
			const [line] = highlighter.codeToTokensBase(`!else ${condition} FOO`, {
				lang: 'nsis',
				theme: 'nord',
				includeExplanation: true,
			});
			const directive = line.find((token) => token.content.includes('!else'));
			const scopes = directive?.explanation?.flatMap((part) => part.scopes.map((scope) => scope.scopeName));

			expect(directive?.content).toBe(`!else ${condition}`);
			expect(scopes).toContain('keyword.control.nsis');
		}

		highlighter.dispose();
	});
});
