import { readFileSync } from 'node:fs';
import { jsonc as JSONC } from 'jsonc';
import retrie from 'retrie';

const languagePath = new URL('../../../data/language.jsonc', import.meta.url);
const language = JSONC.parse(readFileSync(languagePath, 'utf-8'));

function optimizePattern(words) {
	return retrie(words).toString();
}

export function keywordPattern() {
	return new RegExp(`^\\s*${optimizePattern(language.keywords)}\\b`);
}

export function blockPattern() {
	return new RegExp(`(?:\\b|^\\s*)${optimizePattern(language.blocks)}\\b`);
}

export function propertyPattern() {
	return new RegExp(`(?:\\b|^\\s*)${optimizePattern(language.properties)}\\b`);
}

export function compilerPattern() {
	return new RegExp(`^\\s*${optimizePattern(language.compiler)}\\b`);
}

/**
 * `!else` takes an optional condition, e.g. `!else ifdef FOO`. The valid conditions
 * are the `!if` variants without their exclamation mark.
 */
function elsePattern() {
	const conditions = language.compilerBlocks.filter((block) => block.startsWith('!if')).map((block) => block.slice(1));

	return `!else(?:[ \\t]+${optimizePattern(conditions)})?`;
}

export function compilerBlockPattern() {
	return new RegExp(`^\\s*(?:${elsePattern()}|${optimizePattern(language.compilerBlocks)})\\b`);
}
