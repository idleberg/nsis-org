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

export function compilerBlockPattern() {
	return new RegExp(`^\\s*${optimizePattern(language.compilerBlocks)}\\b`);
}
