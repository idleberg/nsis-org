/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: NSIS definitions */

/**
 * Keyword roles that drive indentation, as defined by the Dent Style Specification.
 *
 * Generated from @nsis/dent-spec 0.0.0 by `npm run codegen` — do not edit.
 */

/**
 * Keyword roles for indentation.
 *
 * - **open**  — printed at the *current* level, then level increases.
 * - **close** — level decreases first, then printed at the new level.
 * - **case**  — printed one level inside the parent, body one level further.
 * - **mid**   — printed one level *back* (like the opening keyword),
 *               but the level stays the same (e.g. `${Else}`, `!else`).
 * - **closeAfter** — printed at the *current* level, then level decreases
 *               (e.g. `${Break}`).
 */
export const rules = {
	/** Keywords that open a block (indent children). */
	open: new Set([
		'!if',
		'!ifdef',
		'!ifmacrodef',
		'!ifmacrondef',
		'!ifndef',
		'!macro',
		'${do}',
		'${dountil}',
		'${dowhile}',
		'${for}',
		'${foreach}',
		'${if}',
		'${ifnot}',
		'${mementosection}',
		'${mementosectionex}',
		'${mementounselectedsection}',
		'${select}',
		'${switch}',
		'${unless}',
		'${while}',
		'function',
		'pageex',
		'section',
		'sectiongroup',
	]),
	/** Case arms within a switch or select block. */
	case: new Set([
		'${case_else}',
		'${case}',
		'${case2}',
		'${case3}',
		'${case4}',
		'${case5}',
		'${caseelse}',
		'${default}',
	]),
	/** Keywords that close a block (dedent themselves). */
	close: new Set([
		'!endif',
		'!macroend',
		'${endif}',
		'${endselect}',
		'${endswitch}',
		'${endunless}',
		'${endwhile}',
		'${loop}',
		'${loopuntil}',
		'${loopwhile}',
		'${mementosectionend}',
		'${next}',
		'functionend',
		'pageexend',
		'sectionend',
		'sectiongroupend',
	]),
	/** Keywords printed at the opener's level without changing depth. */
	mid: new Set([
		'!else',
		'!elseif',
		'${andif}',
		'${andifnot}',
		'${andunless}',
		'${else}',
		'${elseif}',
		'${elseifnot}',
		'${elseunless}',
		'${orif}',
		'${orifnot}',
		'${orunless}',
	]),
	/** Keywords printed at the current level that then dedent. */
	closeAfter: new Set([
		'${break}',
	]),
};
