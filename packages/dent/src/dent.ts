import { parse } from '@nsis/parser';
import { type CommentStyle, print } from './printer.ts';

export type { CommentStyle } from './printer.ts';

const defaultIndentation = 2;

export type DentOptions = {
	/**
	 * Marker to use for single-line comments. When omitted, every comment keeps the marker it
	 * was written with. Block comments are never rewritten.
	 */
	commentStyle?: CommentStyle;
	endOfLine?: 'crlf' | 'lf';
	indentSize?: number;
	printWidth?: number;
	singleQuote?: boolean;
	trimEmptyLines?: boolean;
	useTabs?: boolean;
};

export type DentFunctions = {
	format: (fileContents: string) => string;
	check: (fileContents: string) => string | null;
};

/**
 * Formats the given file contents using the Dent formatting style.
 *
 * @param {Options} options - The options for the Dent formatter.
 * @returns An object with `format` and `check` functions.
 * @throws {TypeError} If an option has the wrong type.
 * @throws {RangeError} If an option is out of range, or `useTabs` is `false` without a positive `indentSize`.
 */
export function createFormatter(options: DentOptions = {}): DentFunctions {
	const mergedOptions: DentOptions = {
		commentStyle: undefined,
		indentSize: defaultIndentation,
		printWidth: 120,
		singleQuote: false,
		trimEmptyLines: true,
		useTabs: true,
		...options,
	};

	validateOptions(mergedOptions);

	if (mergedOptions.useTabs === false) {
		if (!(mergedOptions.indentSize ?? defaultIndentation)) {
			throw new RangeError('The indentSize option expects a positive integer');
		}
	}

	/**
	 * Formats the given file contents using the Dent formatting style.
	 *
	 * Parses the input into a CST, then prints it back with canonical
	 * casing, normalised whitespace, and tree-depth-based indentation.
	 *
	 * @param {string} fileContents - The contents of the file to be formatted.
	 * @returns {string} The formatted file contents.
	 */
	function format(fileContents: string): string {
		const nodes = parse(fileContents);
		const eol = detectEOL(fileContents);

		return print(nodes, {
			useTabs: mergedOptions.useTabs ?? true,
			indentSize: mergedOptions.indentSize ?? defaultIndentation,
			printWidth: mergedOptions.printWidth ?? 120,
			singleQuote: mergedOptions.singleQuote ?? false,
			commentStyle: mergedOptions.commentStyle,
			trimEmptyLines: mergedOptions.trimEmptyLines ?? true,
			eol,
		});
	}

	/**
	 * Checks whether the given file contents are already compliant with the
	 * current format settings (i.e. formatting would not change the code).
	 *
	 * @param {string} fileContents - The contents of the file to check.
	 * @returns {string | null} `null` if the file is already formatted, otherwise the formatted string.
	 */
	function check(fileContents: string): string | null {
		const formatted = format(fileContents);

		return formatted !== fileContents ? formatted : null;
	}

	/**
	 * Determines the desired end-of-line characters for the output.
	 *
	 * Detection follows §4 of the Dent Style Specification: the output is LF only when the
	 * input contains an LF and no CRLF. A single CRLF anywhere — or no line ending at all —
	 * yields CRLF, so a file carrying any Windows endings keeps them.
	 *
	 * @param {string} input - The input string (used as fallback for detection).
	 * @returns {string} The end-of-line characters to use in the output.
	 */
	function detectEOL(input: string): string {
		if (mergedOptions.endOfLine) {
			return mergedOptions.endOfLine === 'crlf' ? '\r\n' : '\n';
		}

		return input.includes('\n') && !input.includes('\r\n') ? '\n' : '\r\n';
	}

	return { format, check };
}

const enumOptions = { commentStyle: ['hash', 'semi'], endOfLine: ['lf', 'crlf'] } as const;
const integerOptions = ['indentSize', 'printWidth'] as const;
const booleanOptions = ['singleQuote', 'trimEmptyLines', 'useTabs'] as const;

/**
 * Rejects option values outside `schemas/options.schema.json`: a wrong type throws a `TypeError`,
 * a value of the right type but out of range throws a `RangeError`. An option set to `undefined`
 * counts as omitted, and unknown keys are ignored.
 */
function validateOptions(options: DentOptions): void {
	for (const [key, allowed] of Object.entries(enumOptions)) {
		const value = options[key as keyof typeof enumOptions];
		if (value === undefined) continue;
		if (typeof value !== 'string') throw new TypeError(`The ${key} option expects a string`);
		if (!(allowed as readonly string[]).includes(value)) {
			throw new RangeError(`The ${key} option expects one of: ${allowed.join(', ')}`);
		}
	}

	for (const key of integerOptions) {
		const value = options[key];
		if (value === undefined) continue;
		if (typeof value !== 'number') throw new TypeError(`The ${key} option expects a number`);
		if (!Number.isInteger(value) || value < 0) {
			throw new RangeError(`The ${key} option expects a non-negative integer`);
		}
	}

	for (const key of booleanOptions) {
		const value = options[key];
		if (value !== undefined && typeof value !== 'boolean') {
			throw new TypeError(`The ${key} option expects a boolean`);
		}
	}
}
