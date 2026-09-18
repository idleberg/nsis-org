/**
 * Public types for the data files of the Dent Style Specification.
 *
 * The package ships data, not behaviour: the tables, the JSON Schemas and the conformance
 * cases are plain files, addressable as `@nsis/dent-spec/tables/casing.json`,
 * `@nsis/dent-spec/schemas/options.schema.json` and `@nsis/dent-spec/cases/<area>/<name>/…`.
 *
 * These types describe those files for TypeScript consumers; `src/schemas.ts` holds the
 * Valibot schemas the normative JSON Schemas are generated from, and a test asserts the two
 * stay in step.
 */

/** Base URL the normative JSON Schemas are published under. */
export const SCHEMA_BASE_URL = 'https://idleberg.github.io/nsis-org/dent-spec/schemas/v1';

/** A table that lists canonical spellings, with the lookup key being the lowercased spelling. */
export type CanonicalTable = {
	/** URL of the JSON Schema this file conforms to. */
	$schema?: string;
	/** Canonical spellings, sorted case-insensitively. */
	values: string[];
};

/** `tables/casing.json` — canonical spellings of instructions and compiler commands. */
export type CasingTable = CanonicalTable;

/** `tables/includes.json` — canonical spellings of bundled include library macros. */
export type IncludesTable = CanonicalTable;

/** `tables/parameters.json` — canonical casing of instruction parameters. */
export type ParametersTable = {
	/** URL of the JSON Schema this file conforms to. */
	$schema?: string;
	/** Switches valid across instructions, e.g. `/REBOOTOK`. */
	global: string[];
	/** Switches taking a value, matched by prefix, e.g. `/TIMEOUT=`. */
	globalPrefixes: string[];
	/** Parameters valid for one instruction, keyed by lowercased instruction name. */
	instruction: Record<string, string[]>;
};

/** `tables/blocks.json` — keyword roles that drive indentation. */
export type BlocksTable = {
	/** URL of the JSON Schema this file conforms to. */
	$schema?: string;
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

/**
 * A conformance case's `options.toml`, with spec defaults applied.
 *
 * Keys are snake_case; each implementation maps them onto its own API.
 */
export type Options = {
	/** Line ending style. Omitted means auto-detect from the input. */
	end_of_line?: EndOfLine;
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

/** The defaults a case inherits when it ships no `options.toml`. */
export const DEFAULT_OPTIONS: Options = {
	indent_size: 2,
	trim_empty_lines: true,
	use_tabs: true,
	print_width: 120,
	single_quote: false,
};
