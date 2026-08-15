import { glob, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { Command } from 'commander';
import { blue } from 'kleur/colors';
import { logger } from '../log.ts';
import { fileExists } from '../utils.ts';
import { type FormattingOptions, warnFormattingOptions } from './options.ts';

export type SharedOptions = FormattingOptions & { debug: boolean };

export type DentOptions = {
	endOfLine: 'crlf' | 'lf';
	indentSize: number;
	printWidth: number;
	singleQuote: boolean;
	trimEmptyLines: boolean;
	useTabs: boolean;
};

export function hasStdin(): boolean {
	return !process.stdin.isTTY;
}

export async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];

	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks).toString();
}

export function prepareAction<T extends SharedOptions>(args: string[], command: Command): T {
	const options = command.optsWithGlobals() as T;

	if (!args.length && !hasStdin()) {
		command.help();
	}

	if (options.debug) {
		logger.debug('\nCLI parameters:', { args, options });
	}

	warnFormattingOptions(options);

	return options;
}

export function dentOptionsFrom(options: FormattingOptions): DentOptions {
	return {
		endOfLine: options.eol,
		indentSize: options.indentSize,
		printWidth: options.printWidth,
		singleQuote: options.singleQuote,
		trimEmptyLines: options.trim,
		useTabs: !options.useSpaces,
	};
}

export async function resolveFiles(patterns: string[]): Promise<string[]> {
	const expanded: string[] = [];

	for (const pattern of patterns) {
		try {
			const s = await stat(pattern);
			if (s.isDirectory()) {
				expanded.push(join(pattern, '*.nsi'), join(pattern, '*.nsh'));
				continue;
			}
		} catch {}
		expanded.push(pattern);
	}

	return Array.fromAsync(glob(expanded, { cwd: process.cwd() }));
}

export function formatParseError(error: unknown): string {
	if (error instanceof SyntaxError && 'location' in error) {
		const loc = (error as SyntaxError & { location: { start: { line: number; column: number } } }).location;
		return `Parse error at line ${loc.start.line}, column ${loc.start.column}: ${error.message}`;
	}
	return String(error);
}

export async function loadScript(file: string): Promise<string | null> {
	if (!file.endsWith('.nsi') && !file.endsWith('.nsh')) {
		logger.warn(`${blue(file)} is not an NSIS script, skipping.`);
		return null;
	}

	if ((await fileExists(file)) === false) {
		logger.warn(`${blue(file)} does not exist, skipping.`);
		return null;
	}

	return (await readFile(file)).toString();
}

/**
 * Runs `onFile` for every file that could be read and parsed.
 *
 * Returns the number of files that failed alongside the duration. Failures have to surface in
 * the exit code: a file that cannot be parsed produces no output at all, so exiting 0 would be
 * indistinguishable from formatting it to nothing.
 */
export async function processFiles(
	patterns: string[],
	check: (input: string) => string | null,
	emptyExitCode: number,
	onFile: (file: string, result: string | null, rawContents: string, duration: number) => Promise<void> | void,
	onError: (file: string, error: unknown, duration: number) => void,
): Promise<{ duration: number; failures: number }> {
	const files = await resolveFiles(patterns);

	if (files.length === 0) {
		logger.error('No valid input files provided, exiting.');
		process.exit(emptyExitCode);
	}

	const outerStartTime = performance.now();
	let failures = 0;

	for (const file of files) {
		const startTime = performance.now();
		const rawContents = await loadScript(file);
		if (rawContents === null) continue;

		let result: string | null;
		try {
			result = check(rawContents);
		} catch (error) {
			failures++;
			onError(file, error, Math.round(performance.now() - startTime));
			continue;
		}

		await onFile(file, result, rawContents, Math.round(performance.now() - startTime));
	}

	return { duration: Math.round(performance.now() - outerStartTime), failures };
}
