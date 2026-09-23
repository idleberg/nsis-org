/**
 * Runs the conformance cases of the Dent Style Specification.
 *
 * The cases are the authority: where a case and Dent disagree, Dent is wrong. Cases are read
 * from the installed `@nsis/dent-spec`, so the suite grows when the spec is upgraded.
 */

import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createFormatter, type DentOptions } from '../src/dent.ts';

const specDir = dirname(createRequire(import.meta.url).resolve('@nsis/dent-spec/package.json'));
const casesDir = join(specDir, 'cases');

async function findCases(dir: string): Promise<string[]> {
	const found: string[] = [];

	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (!entry.isDirectory()) continue;

		const path = join(dir, entry.name);
		const files = await readdir(path);

		if (files.includes('input.nsi')) {
			found.push(relative(casesDir, path));
			continue;
		}

		found.push(...(await findCases(path)));
	}

	return found.sort();
}

/** Maps the spec's snake_case option keys onto Dent's own naming. */
const optionKeys: Record<string, keyof DentOptions> = {
	comment_style: 'commentStyle',
	end_of_line: 'endOfLine',
	indent_size: 'indentSize',
	print_width: 'printWidth',
	single_quote: 'singleQuote',
	trim_empty_lines: 'trimEmptyLines',
	use_tabs: 'useTabs',
};

async function readOptions(caseDir: string): Promise<DentOptions> {
	const contents = await readFile(join(caseDir, 'options.toml'), 'utf-8').catch(() => undefined);

	if (contents === undefined) return {};

	const options: Record<string, unknown> = {};

	for (const line of contents.split('\n')) {
		const trimmed = line.trim();
		if (trimmed === '' || trimmed.startsWith('#')) continue;

		const match = /^([a-z_]+)\s*=\s*(.+)$/.exec(trimmed);
		if (!match) throw new Error(`unparsable options.toml line: ${line}`);

		const [, key, rawValue] = match as RegExpExecArray;
		const mapped = optionKeys[key as string];
		if (!mapped) throw new Error(`unknown option in options.toml: ${key}`);

		const value = rawValue as string;
		options[mapped] =
			value === 'true'
				? true
				: value === 'false'
					? false
					: /^-?\d+$/.test(value)
						? Number(value)
						: value.replace(/^"|"$/g, '');
	}

	return options as DentOptions;
}

const cases = await findCases(casesDir);

describe('Dent Style Specification conformance', () => {
	it('found cases to run', () => {
		expect(cases.length).toBeGreaterThan(0);
	});

	it.each(cases)('%s', async (id) => {
		const caseDir = join(casesDir, id);
		const files = await readdir(caseDir);
		const input = await readFile(join(caseDir, 'input.nsi'), 'utf-8');
		const options = await readOptions(caseDir);
		if (files.includes('error')) {
			// Invalid options (§3) are rejected when the formatter is created, not when it formats.
			expect(() => createFormatter(options).format(input)).toThrow();
			return;
		}

		const { format } = createFormatter(options);

		const expected = await readFile(join(caseDir, 'output.nsi'), 'utf-8');

		expect(format(input)).toBe(expected);

		// §1.3: formatting is idempotent.
		expect(format(expected)).toBe(expected);
	});
});
