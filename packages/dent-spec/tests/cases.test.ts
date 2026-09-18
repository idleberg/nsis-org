import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { OptionsSchema } from '../src/schemas.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const casesDir = join(root, 'cases');

/** Every case directory, as the `<area>/<name>` id used in citations. */
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

const cases = await findCases(casesDir);
const spec = await readFile(join(root, 'SPEC.md'), 'utf-8');

describe('case layout', () => {
	it('finds cases', () => {
		expect(cases.length).toBeGreaterThan(0);
	});

	it.each(cases)('%s has an input and exactly one expectation', async (id) => {
		const files = await readdir(join(casesDir, id));

		expect(files).toContain('input.nsi');

		const hasOutput = files.includes('output.nsi');
		const hasError = files.includes('error');

		expect(hasOutput !== hasError, 'needs either output.nsi or an error marker').toBe(true);
	});

	it.each(cases)('%s contains no unexpected files', async (id) => {
		const allowed = new Set(['input.nsi', 'output.nsi', 'options.toml', 'error']);
		const files = await readdir(join(casesDir, id));

		expect(files.filter((file) => !allowed.has(file))).toEqual([]);
	});

	it.each(cases)('%s has non-empty files', async (id) => {
		const { size } = await stat(join(casesDir, id, 'input.nsi'));

		expect(size).toBeGreaterThan(0);
	});
});

describe('case options', () => {
	it.each(cases)('%s has a valid options.toml, if any', async (id) => {
		const path = join(casesDir, id, 'options.toml');
		const contents = await readFile(path, 'utf-8').catch(() => undefined);

		if (contents === undefined) return;

		// Minimal TOML: `#:schema` line, blank lines and `key = value` pairs.
		const parsed: Record<string, unknown> = {};

		for (const line of contents.split('\n')) {
			const trimmed = line.trim();
			if (trimmed === '' || trimmed.startsWith('#')) continue;

			const match = /^([a-z_]+)\s*=\s*(.+)$/.exec(trimmed);
			expect(match, `unparsable line in ${id}/options.toml: ${line}`).not.toBeNull();

			const [, key, rawValue] = match as RegExpExecArray;
			const value = rawValue as string;

			parsed[key as string] =
				value === 'true'
					? true
					: value === 'false'
						? false
						: /^-?\d+$/.test(value)
							? Number(value)
							: value.replace(/^"|"$/g, '');
		}

		expect(() => v.parse(OptionsSchema, parsed)).not.toThrow();
	});

	it.each(cases)('%s declares the options schema', async (id) => {
		const path = join(casesDir, id, 'options.toml');
		const contents = await readFile(path, 'utf-8').catch(() => undefined);

		if (contents === undefined) return;

		expect(contents).toContain('#:schema https://idleberg.github.io/nsis-org/dent-spec/schemas/v1/options.schema.json');
	});
});

describe('SPEC.md citations', () => {
	/** Case ids cited anywhere in SPEC.md, e.g. `cases/blocks/switch-case`. */
	const cited = new Set([...spec.matchAll(/`cases\/([^`]+)`/g)].map(([, id]) => id as string));

	it('cites only cases that exist', () => {
		const dangling = [...cited].filter((id) => !cases.includes(id)).sort();

		expect(dangling, `cited in SPEC.md but missing from cases/: ${dangling.join(', ')}`).toEqual([]);
	});

	it('cites every case', () => {
		const uncited = cases.filter((id) => !cited.has(id));

		expect(uncited, `cases/ entries never cited in SPEC.md: ${uncited.join(', ')}`).toEqual([]);
	});
});
