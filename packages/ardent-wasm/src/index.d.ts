import type { ArdentOptions } from '../dist/ardent_wasm.js';

export type { ArdentOptions, CommentStyle, EndOfLine } from '../dist/ardent_wasm.js';

export type ArdentFunctions = {
	format: (fileContents: string) => string;
	/** Returns the formatted script, or `null` when the input is already formatted. */
	check: (fileContents: string) => string | null;
};

/**
 * Creates a formatter that renders NSIS scripts in Dent style.
 *
 * @throws {Error} If an option is invalid. The input is not validated until it is formatted.
 */
export function createFormatter(options?: ArdentOptions): ArdentFunctions;
