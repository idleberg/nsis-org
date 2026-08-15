import { structuredPatch } from 'diff';
import { bold, cyan, green, red } from 'kleur/colors';
import { logger } from '../log.ts';

/**
 * Number of unchanged lines printed before and after each hunk, matching the
 * GNU `diff -u` default.
 */
const CONTEXT = 3;

/**
 * Formats one side of a hunk header the way GNU `diff -u` does: the count is
 * omitted for single-line ranges, and an empty range points at the line before
 * the insertion point.
 * @internal
 */
function formatRange(start: number, lines: number): string {
	if (lines === 0) {
		return `${start - 1},0`;
	}

	if (lines === 1) {
		return `${start}`;
	}

	return `${start},${lines}`;
}

/**
 * Builds a unified diff between two strings.
 *
 * Pass `null` as label to omit the `--- a/…` / `+++ b/…` header, e.g. when the
 * input came from stdin. Returns an empty array when both sides are identical.
 */
export function unifiedDiff(label: string | null, original: string, formatted: string): string[] {
	const { hunks } = structuredPatch('a', 'b', original, formatted, undefined, undefined, { context: CONTEXT });

	if (hunks.length === 0) {
		return [];
	}

	const out: string[] = [];

	if (label !== null) {
		out.push(`--- a/${label}`, `+++ b/${label}`);
	}

	for (const hunk of hunks) {
		out.push(`@@ -${formatRange(hunk.oldStart, hunk.oldLines)} +${formatRange(hunk.newStart, hunk.newLines)} @@`);
		out.push(...hunk.lines);
	}

	return out;
}

/**
 * Colorizes a rendered diff line. Header lines are excluded by the caller.
 * @internal
 */
function colorize(line: string): string {
	if (line.startsWith('@@')) {
		return cyan(line);
	}

	if (line.startsWith('+')) {
		return green(line);
	}

	if (line.startsWith('-')) {
		return red(line);
	}

	return line;
}

/**
 * Prints a unified diff for a single file. Pass `null` as label to omit the
 * `--- a/…` / `+++ b/…` header, e.g. when the input came from stdin.
 */
export function printDiff(label: string | null, original: string, formatted: string): void {
	const lines = unifiedDiff(label, original, formatted);

	if (lines.length === 0) {
		return;
	}

	const headerLines = label === null ? 0 : 2;
	const painted = lines.map((line, index) => (index < headerLines ? bold(line) : colorize(line)));

	logger.log(painted.join('\n'));
}
