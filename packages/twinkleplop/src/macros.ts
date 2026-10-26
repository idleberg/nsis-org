import { readFileSync } from 'node:fs';
import blocks from '@nsis/dent-spec/tables/blocks.json' with { type: 'json' };
import includes from '@nsis/dent-spec/tables/includes.json' with { type: 'json' };
import variables from '@nsis/dent-spec/tables/variables.json' with { type: 'json' };
import { jsonc as JSONC } from 'jsonc';

type Language = {
	keywords: string[];
	blocks: string[];
	properties: string[];
};

const languagePath = new URL('../../../data/language.jsonc', import.meta.url);
const language: Language = JSONC.parse(readFileSync(languagePath, 'utf-8'));

/**
 * LogicLib macros that change control flow without opening or closing a block,
 * so `blocks.json` does not list them.
 */
const LOGICLIB_FLOW = ['Continue', 'ExitDo', 'ExitFor', 'ExitWhile', 'IfCmd', 'IfNotThen', 'IfThen'];

/** `${If}` → `if` */
function unwrap(macro: string): string {
	return macro.slice(2, -1).toLowerCase();
}

function fold(words: string[]): string[] {
	return words.map((word) => word.toLowerCase());
}

function blockMacros(): string[] {
	return Object.values(blocks)
		.filter((value) => Array.isArray(value))
		.flat()
		.filter((word) => word.startsWith('${'))
		.map(unwrap);
}

export function instructions(): string[] {
	return fold([...language.keywords, ...language.blocks]);
}

export function constants(): string[] {
	return fold(language.properties);
}

/** Include library macros that structure code, highlighted as keywords. */
export function logicLib(): string[] {
	return [...blockMacros(), ...fold(LOGICLIB_FLOW)];
}

/** Also lists the LogicLib macros, the reclassifier checks those first. */
export function includeMacros(): string[] {
	return includes.values.map(unwrap);
}

/** Registers `$0`–`$9` and `$R0`–`$R9` stay plain variables. */
export function builtinVariables(): string[] {
	return fold(variables.variables.filter((name) => !/^R?\d$/.test(name)));
}

export function builtinDefines(): string[] {
	return variables.defines.map(unwrap);
}
