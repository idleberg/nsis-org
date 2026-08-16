/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: NSIS macro references */

import { MacroBreak, MacroCase, MacroClose, MacroMid, MacroOpen } from './parser.terms.ts';

/** Lowercase helper – NSIS macro names are case-insensitive. */
function lowerSet(macros: string[]): Set<string> {
	return new Set(macros.map((macro) => macro.toLowerCase()));
}

/** Built-in macros that open a block. */
export const open = lowerSet([
	'${Do}',
	'${DoUntil}',
	'${DoWhile}',
	'${For}',
	'${ForEach}',
	'${If}',
	'${IfNot}',
	'${MementoSection}',
	'${MementoUnselectedSection}',
	'${Select}',
	'${Switch}',
	'${Unless}',
	'${While}',
]);

/** Built-in macros that continue a block without changing its depth. */
export const mid = lowerSet([
	'${AndIf}',
	'${AndIfNot}',
	'${AndUnless}',
	'${Else}',
	'${ElseIf}',
	'${ElseIfNot}',
	'${ElseUnless}',
	'${OrIf}',
	'${OrIfNot}',
	'${OrUnless}',
]);

/** Built-in macros that close a block. */
export const close = lowerSet([
	'${EndIf}',
	'${EndSelect}',
	'${EndSwitch}',
	'${EndUnless}',
	'${EndWhile}',
	'${Loop}',
	'${LoopUntil}',
	'${LoopWhile}',
	'${MementoSectionEnd}',
	'${Next}',
]);

/** Case arms of a `${Switch}` or `${Select}` block. */
export const caseArm = lowerSet([
	'${Case}',
	'${Case2}',
	'${Case3}',
	'${Case4}',
	'${Case5}',
	'${CaseElse}',
	'${Default}',
]);

/** Macros that a line can be dedented on, i.e. everything that is not an opener. */
export const dedentOn = new Set([...close, ...mid]);

/**
 * Specializes a `DefineReference` token into a block keyword.
 *
 * Returns `-1` for anything else, so a user define such as `${APP_NAME}` stays
 * a plain `DefineReference`.
 */
export function specializeMacro(value: string) {
	const macro = value.toLowerCase();

	if (open.has(macro)) return MacroOpen;
	if (mid.has(macro)) return MacroMid;
	if (close.has(macro)) return MacroClose;
	if (caseArm.has(macro)) return MacroCase;
	if (macro === '${break}') return MacroBreak;

	return -1;
}
