// nsis reclassifier, word lists generated from data/language.jsonc and the
// dent-spec tables at build time
//
// makensis matches instructions case-insensitively, so the grammar emits every
// word as identifier and this pass looks it up folded. instructions count only
// at the head of a line, every other word is checked against the constants

import type { LanguagePipeline, Reclassifier } from '@twinkleplop/core';
import { compile_word_table, tag, word_table_get } from '@twinkleplop/core';
import { builtinDefines, builtinVariables, constants, includeMacros, instructions, logicLib } from './macros.ts' with {
	type: 'macro',
};

const DEPRECATED = [
	'CompareDLLVersions',
	'CompareFileTimes',
	'DirShow',
	'DisabledBitmap',
	'EnabledBitmap',
	'GetFullDLLPath',
	'GetParent',
	'GetWinampInstPath',
	'LangStringUP',
	'PackEXEHeader',
	'SectionDivider',
	'SetPluginUnload',
	'SubSection',
	'SubSectionEnd',
	'UninstallExeName',
];

const BOOLEANS = ['true', 'on', 'false', 'off'];

const fold = (words: string[]) => words.map((word) => word.toLowerCase());

const HEAD_WORDS = compile_word_table([[...instructions(), ...fold(DEPRECATED)]], { fold: true });
// a word takes the first table holding it, booleans are in the vocabulary too
const ARG_WORDS = compile_word_table([BOOLEANS, constants()], { fold: true });
const VARIABLE_WORDS = compile_word_table([builtinVariables()], { fold: true });
const DEFINE_WORDS = compile_word_table([logicLib(), includeMacros(), builtinDefines()], {
	fold: true,
});

// the word after one of these names what it declares
const DECLARES: Record<string, string> = {
	function: 'function',
	'!macro': 'function',
	'!insertmacro': 'function',
	'!define': 'constant',
	var: 'variable',
};

const ELSE_IF = new Set(['if', 'ifdef', 'ifndef', 'ifmacrodef', 'ifmacrondef']);

// only blanks before it on its line, and the line before does not continue
function at_line_head(input: string, start: number): boolean {
	let i = start - 1;
	while (i >= 0 && (input[i] === ' ' || input[i] === '\t')) i--;
	if (i < 0) return true;
	if (input[i] !== '\n') return false;
	if (input[i - 1] === '\r') i--;
	return input[i - 1] !== '\\';
}

const word_reclassifier: Reclassifier = (input, result) => {
	const { tokens, token_types } = result;
	const n = tokens.length / 3;

	const id = (name: string): number => {
		let index = token_types.indexOf(name);
		if (index < 0) {
			index = token_types.length;
			token_types.push(name);
		}
		return index;
	};

	const identifier = token_types.indexOf('identifier');
	const variable = token_types.indexOf('variable');
	const constant = token_types.indexOf('constant');
	const parameter = token_types.indexOf('parameter');
	const KEYWORD = id('keyword');
	const FUNCTION = id('function');
	const BUILTIN = id('builtin');
	const LABEL = id('label');
	const CONSTANT = id('constant');
	const BOOLEAN = id('boolean');
	const DEFINE_TYPES = [0, KEYWORD, FUNCTION, BUILTIN];

	let previous = -1;
	for (let i = 0; i < n; i++) {
		// the defaults only satisfy the type checker, the slice always holds three values
		const [type = 0, start = 0, end = 0] = tokens.subarray(i * 3, i * 3 + 3);

		if (type === variable) {
			if (word_table_get(VARIABLE_WORDS, input, start + 1, end)) tokens[i * 3] = BUILTIN;
		} else if (type === constant && input.startsWith('${', start) && input[end - 1] === '}') {
			const word = word_table_get(DEFINE_WORDS, input, start + 2, end - 1);
			if (word) tokens[i * 3] = DEFINE_TYPES[word] ?? type;
		} else if (type === identifier) {
			const text = input.slice(start, end);
			const before = previous < 0 ? '' : input.slice(tokens[previous * 3 + 1], tokens[previous * 3 + 2]);
			const declares = tokens[previous * 3] === KEYWORD ? DECLARES[before.toLowerCase()] : undefined;

			if (at_line_head(input, start)) {
				if (word_table_get(HEAD_WORDS, input, start, end)) tokens[i * 3] = KEYWORD;
				else if (text.includes('::')) tokens[i * 3] = FUNCTION;
				else if (input[end - 1] === ':') tokens[i * 3] = LABEL;
			} else if (declares) {
				tokens[i * 3] = id(declares);
			} else if (before.toLowerCase() === '!else' && ELSE_IF.has(text.toLowerCase())) {
				tokens[i * 3] = KEYWORD;
			} else {
				const word = word_table_get(ARG_WORDS, input, start, end);
				if (word) tokens[i * 3] = word === 1 ? BOOLEAN : CONSTANT;
			}
		}

		// options like /GLOBAL sit between a declaration and its name
		if (type !== parameter) previous = i;
	}

	return result;
};

export const reclassifiers: LanguagePipeline = [
	tag(word_reclassifier, ['keyword', 'function', 'builtin', 'label', 'constant', 'boolean', 'variable']),
];
