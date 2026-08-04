import { readFileSync } from 'node:fs';
import { jsonc as JSONC } from 'jsonc';

type Language = {
	keywords: string[];
	blocks: string[];
	properties: string[];
	compiler: string[];
	compilerBlocks: string[];
};

const languagePath = new URL('../../../data/language.jsonc', import.meta.url);
const language: Language = JSONC.parse(readFileSync(languagePath, 'utf-8'));

/**
 * Keywords that would otherwise skew language auto-detection. highlight.js reads
 * the `|<score>` suffix as that keyword's relevance, defaulting to 1.
 *
 * `Name` is a genuine NSIS command, but also an everyday identifier in every
 * other language — and since the definition is case-insensitive, it matches any
 * casing. Scoring it would hand NSIS up to 7 points on unrelated input.
 */
const RELEVANCE_OVERRIDES: Record<string, number> = {
	Name: 0,
};

/**
 * Constants are written with a leading exclamation mark in NSIS, but highlight.js
 * matches that separately.
 */
function withoutPrefix(word: string): string {
	return word.startsWith('!') ? word.slice(1) : word;
}

function isConstantCase(word: string): boolean {
	return /^[A-Z0-9_]+$/.test(word);
}

export function keywords(): string[] {
	return language.keywords.map((keyword) => {
		const relevance = RELEVANCE_OVERRIDES[keyword];

		return relevance === undefined ? keyword : `${keyword}|${relevance}`;
	});
}

export function literals(): string[] {
	return language.properties.filter((property) => !isConstantCase(property));
}

export function parameterNames(): string[] {
	return language.properties.filter(isConstantCase);
}

export function compilerFlags(): string[] {
	return [...language.compiler, ...language.compilerBlocks].map(withoutPrefix);
}

/**
 * Unlike the other lists, `beginKeywords` expects a whitespace-separated string.
 */
export function blockKeywords(): string {
	return language.blocks.join(' ');
}
