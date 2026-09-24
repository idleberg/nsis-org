/**
 * Public types for the data files of the Dent Style Specification.
 *
 * The package ships data, not behaviour: the tables, the JSON Schemas and the conformance
 * cases are plain files, addressable as `@nsis/dent-spec/tables/casing.json`,
 * `@nsis/dent-spec/schemas/options.schema.json` and `@nsis/dent-spec/cases/<area>/<name>/…`.
 *
 * The Valibot schemas in `src/schemas.ts` are the authoring source the normative JSON
 * Schemas are generated from, and these types must describe exactly what those schemas
 * accept. They are written out structurally rather than re-exported as `v.InferOutput<…>`,
 * because re-exporting the inferred types makes the emitted declarations carry Valibot's
 * whole generic machinery — 600 kB of it — to describe what are mostly arrays of strings.
 *
 * The `AssertEquals` block at the end of this file is what keeps that safe: it is a
 * compile-time proof that every type here is identical to the one the schema infers, so a
 * hand-written copy cannot silently drift. Change a schema without changing these types and
 * `npm run build` fails.
 */

import type * as schema from './schemas.ts';

export { SCHEMA_BASE_URL } from './schemas.ts';

/** A table that lists canonical spellings, with the lookup key being the lowercased spelling. */
export type CanonicalTable = {
	/** Canonical spellings, sorted case-insensitively. */
	values: string[];
};

/** `tables/casing.json` — canonical spellings of instructions and compiler commands. */
export type CasingTable = CanonicalTable;

/** `tables/includes.json` — canonical spellings of bundled include library macros. */
export type IncludesTable = CanonicalTable;

/** `tables/parameters.json` — canonical casing of instruction parameters. */
export type ParametersTable = {
	/** Switches valid across instructions, e.g. `/REBOOTOK`. */
	global: string[];
	/** Switches taking a value, matched by prefix, e.g. `/TIMEOUT=`. */
	globalPrefixes: string[];
	/** Parameters valid for one instruction, keyed by lowercased instruction name. */
	instruction: Record<string, string[]>;
};

/** `tables/variables.json` — canonical casing of built-in variables, defines and language strings. */
export type VariablesTable = {
	/** Built-in variable names, without the leading `$`. */
	variables: string[];
	/** Built-in define names, without the surrounding `${}`. */
	defines: string[];
	/** Built-in language string names, including the leading `^`. */
	langStrings: string[];
};

/** `tables/blocks.json` — keyword roles that drive indentation. */
export type BlocksTable = {
	/** Printed at the current level, then the level increases. */
	open: string[];
	/** Case arms: printed one level inside their parent, body one level further. */
	case: string[];
	/** The level decreases first, then the keyword is printed. */
	close: string[];
	/** Printed one level back, leaving the level unchanged, e.g. `${Else}`. */
	mid: string[];
	/** Printed at the current level, then the level decreases, e.g. `${Break}`. */
	closeAfter: string[];
};

/** Line ending style for formatted output. */
export type EndOfLine = 'lf' | 'crlf';

/** Marker for single-line comments. */
export type CommentStyle = 'hash' | 'semi';

/**
 * A conformance case's `options.toml`, with spec defaults applied.
 *
 * Keys are snake_case; each implementation maps them onto its own API.
 */
export type Options = {
	/**
	 * Marker for single-line comments. Omitted keeps each comment as written; block comments
	 * are never rewritten.
	 */
	comment_style?: CommentStyle | undefined;
	/** Line ending style. Omitted means auto-detect from the input. */
	end_of_line?: EndOfLine | undefined;
	/** Spaces per indent level. Ignored when `use_tabs` is true. */
	indent_size: number;
	/** Collapse consecutive blank lines and strip leading/trailing blanks. */
	trim_empty_lines: boolean;
	/** Indent with tabs rather than spaces. */
	use_tabs: boolean;
	/** Maximum line width before wrapping with `\` continuations. 0 disables wrapping. */
	print_width: number;
	/** Prefer single quotes over double quotes. */
	single_quote: boolean;
};

/**
 * The defaults a case inherits when it ships no `options.toml`.
 *
 * Restated as a literal so the published entry point stays free of a runtime dependency on
 * Valibot. `tests/options.test.ts` asserts it equals `v.getDefaults(OptionsSchema)`, so it
 * cannot drift from the schema it mirrors.
 */
export const DEFAULT_OPTIONS: Options = {
	indent_size: 2,
	trim_empty_lines: true,
	use_tabs: true,
	print_width: 120,
	single_quote: false,
};

/*
 * Compile-time proof that the types above match the schemas exactly.
 *
 * `AssertEquals` is invariant in both arguments, so a widened, narrowed or missing property
 * fails the `extends true` constraint rather than passing silently. Nothing below is
 * exported or emitted; it exists only to make `npm run build` fail on divergence.
 */

type AssertEquals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type _CasingMatchesSchema = Expect<AssertEquals<CasingTable, schema.CasingTable>>;
type _IncludesMatchesSchema = Expect<AssertEquals<IncludesTable, schema.IncludesTable>>;
type _ParametersMatchesSchema = Expect<AssertEquals<ParametersTable, schema.ParametersTable>>;
type _VariablesMatchesSchema = Expect<AssertEquals<VariablesTable, schema.VariablesTable>>;
type _BlocksMatchesSchema = Expect<AssertEquals<BlocksTable, schema.BlocksTable>>;
type _OptionsMatchesSchema = Expect<AssertEquals<Options, schema.Options>>;
