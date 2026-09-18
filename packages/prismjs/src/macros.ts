import { readFileSync } from 'node:fs';
import { jsonc as JSONC } from 'jsonc';
import retrie from 'retrie';

type Language = {
	keywords: string[];
	blocks: string[];
	properties: string[];
	compiler: string[];
	compilerBlocks: string[];
};

const languagePath = new URL('../../../data/language.jsonc', import.meta.url);
const language: Language = JSONC.parse(readFileSync(languagePath, 'utf-8'));

function optimizePattern(words: string[]): string {
	return retrie(words).toString();
}

export function keywordPattern(): RegExp {
	return new RegExp(`(^\\s*)${optimizePattern([...language.keywords, ...language.blocks])}\\b`, 'm');
}

export function propertyPattern(): RegExp {
	return new RegExp(`\\b${optimizePattern(language.properties)}\\b`);
}

/**
 * `!else` takes an optional condition, e.g. `!else ifdef FOO`. The valid conditions
 * are the `!if` variants without their exclamation mark.
 */
function elsePattern(): string {
	const conditions = language.compilerBlocks.filter((block) => block.startsWith('!if')).map((block) => block.slice(1));

	return `!else(?:[ \\t]+${optimizePattern(conditions)})?`;
}

export function importantPattern(): RegExp {
	return new RegExp(
		`(^\\s*)(?:${elsePattern()}|${optimizePattern([...language.compiler, ...language.compilerBlocks])})\\b`,
		'im',
	);
}
