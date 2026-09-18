/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: NSIS definitions */

/**
 * Valibot schemas for the data files of the Dent Style Specification.
 *
 * These are the authoring source; `npm run build:schemas` converts them to JSON Schema
 * under `schemas/`, which is the normative artifact consumed by implementations and editors.
 * Only conversion-safe actions may be used here — see `scripts/build-schemas.ts`.
 */

import * as v from 'valibot';

/** Base URL every emitted schema is published under. */
export const SCHEMA_BASE_URL = 'https://idleberg.github.io/nsis-org/dent-spec/schemas/v1';

/**
 * A canonical spelling: the exact casing an implementation must print.
 *
 * Tables list canonical spellings only; the lookup key is the lowercased spelling,
 * so `Section` implies the key `section`.
 */
const canonicalSpelling = v.pipe(v.string(), v.minLength(1));

/** Canonical spellings of NSIS instructions and compiler commands, e.g. `Section`, `!define`. */
export const CasingTableSchema = v.pipe(
	v.object({
		values: v.pipe(
			v.array(canonicalSpelling),
			v.description('Canonical spellings of NSIS instructions and compiler commands.'),
		),
	}),
	v.description('Canonical casing of NSIS instructions and compiler commands.'),
);

/** Canonical spellings of macros from the NSIS bundled include libraries, e.g. `${If}`. */
export const IncludesTableSchema = v.pipe(
	v.object({
		values: v.pipe(
			v.array(v.pipe(v.string(), v.regex(/^\$\{[^}]+\}$/))),
			v.description('Canonical spellings of macros from the NSIS bundled include libraries.'),
		),
	}),
	v.description('Canonical casing of bundled include library macros.'),
);

/** Parameter casing: global switches, prefixed switches, and instruction-scoped values. */
export const ParametersTableSchema = v.pipe(
	v.object({
		global: v.pipe(
			v.array(v.pipe(v.string(), v.regex(/^\/[^=]+$/))),
			v.description('Switches valid across instructions, e.g. `/REBOOTOK`.'),
		),
		globalPrefixes: v.pipe(
			v.array(v.pipe(v.string(), v.regex(/^\/[^=]+=$/))),
			v.description('Switches taking a value, matched by prefix, e.g. `/TIMEOUT=`.'),
		),
		instruction: v.pipe(
			v.record(v.string(), v.array(canonicalSpelling)),
			v.description('Parameters valid for one instruction, keyed by lowercased instruction name.'),
		),
	}),
	v.description('Canonical casing of instruction parameters.'),
);

/**
 * Canonical spellings of NSIS built-in names: variables (`$INSTDIR`), defines
 * (`${NSISDIR}`) and language strings (`$(^Name)`).
 *
 * Built-in names cannot be shadowed, so rewriting their casing is always safe.
 */
export const VariablesTableSchema = v.pipe(
	v.object({
		variables: v.pipe(v.array(canonicalSpelling), v.description('Built-in variable names, without the leading `$`.')),
		defines: v.pipe(v.array(canonicalSpelling), v.description('Built-in define names, without the surrounding `${}`.')),
		langStrings: v.pipe(
			v.array(canonicalSpelling),
			v.description('Built-in language string names, including the leading `^`.'),
		),
	}),
	v.description('Canonical casing of NSIS built-in variables, defines and language strings.'),
);

/** Keyword roles that drive indentation. */
export const BlocksTableSchema = v.pipe(
	v.object({
		open: v.pipe(v.array(canonicalSpelling), v.description('Printed at the current level, then the level increases.')),
		case: v.pipe(
			v.array(canonicalSpelling),
			v.description('Case arms: printed one level inside their parent, body one level further.'),
		),
		close: v.pipe(v.array(canonicalSpelling), v.description('The level decreases first, then the keyword is printed.')),
		mid: v.pipe(
			v.array(canonicalSpelling),
			v.description('Printed one level back, leaving the level unchanged, e.g. `${Else}`.'),
		),
		closeAfter: v.pipe(
			v.array(canonicalSpelling),
			v.description('Printed at the current level, then the level decreases, e.g. `${Break}`.'),
		),
	}),
	v.description('Keyword roles defining block structure.'),
);

/**
 * Formatter options, as used by a conformance case's `options.toml`.
 *
 * Keys are snake_case; each implementation maps them onto its own API.
 * A case that omits `options.toml` uses these defaults.
 */
export const OptionsSchema = v.pipe(
	v.object({
		comment_style: v.pipe(
			v.optional(v.picklist(['hash', 'semi'])),
			v.description(
				'Marker for single-line comments. Omitted keeps each comment as written; block comments are never rewritten.',
			),
		),
		end_of_line: v.pipe(
			v.optional(v.picklist(['lf', 'crlf'])),
			v.description('Line ending style. Omitted means auto-detect from the input.'),
		),
		indent_size: v.pipe(
			v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 2),
			v.description('Spaces per indent level. Ignored when `use_tabs` is true.'),
		),
		trim_empty_lines: v.pipe(
			v.optional(v.boolean(), true),
			v.description('Collapse consecutive blank lines and strip leading/trailing blanks.'),
		),
		use_tabs: v.pipe(v.optional(v.boolean(), true), v.description('Indent with tabs rather than spaces.')),
		print_width: v.pipe(
			v.optional(v.pipe(v.number(), v.integer(), v.minValue(0)), 120),
			v.description('Maximum line width before wrapping with `\\` continuations. 0 disables wrapping.'),
		),
		single_quote: v.pipe(v.optional(v.boolean(), false), v.description('Prefer single quotes over double quotes.')),
	}),
	v.description('Formatter options for a conformance case.'),
);

/** Canonical spellings of NSIS instructions and compiler commands. */
export type CasingTable = v.InferOutput<typeof CasingTableSchema>;
/** Canonical spellings of bundled include library macros. */
export type IncludesTable = v.InferOutput<typeof IncludesTableSchema>;
/** Canonical casing of instruction parameters. */
export type ParametersTable = v.InferOutput<typeof ParametersTableSchema>;
/** Keyword roles defining block structure. */
export type BlocksTable = v.InferOutput<typeof BlocksTableSchema>;
/** Canonical casing of built-in variables, defines and language strings. */
export type VariablesTable = v.InferOutput<typeof VariablesTableSchema>;
/** Formatter options for a conformance case. */
export type Options = v.InferOutput<typeof OptionsSchema>;

/** Every schema that is emitted as JSON Schema, keyed by its emitted file name. */
export const schemas = {
	casing: CasingTableSchema,
	includes: IncludesTableSchema,
	parameters: ParametersTableSchema,
	variables: VariablesTableSchema,
	blocks: BlocksTableSchema,
	options: OptionsSchema,
} as const;
