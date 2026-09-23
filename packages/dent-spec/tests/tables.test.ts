import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsonc as JSONC } from 'jsonc';
import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import {
	BlocksTableSchema,
	CasingTableSchema,
	IncludesTableSchema,
	ParametersTableSchema,
	VariablesTableSchema,
} from '../src/schemas.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function readTable(name: string): Promise<unknown> {
	return JSON.parse(await readFile(join(root, 'tables', `${name}.json`), 'utf-8'));
}

const casing = v.parse(CasingTableSchema, await readTable('casing'));
const includes = v.parse(IncludesTableSchema, await readTable('includes'));
const parameters = v.parse(ParametersTableSchema, await readTable('parameters'));
const blocks = v.parse(BlocksTableSchema, await readTable('blocks'));
const variables = v.parse(VariablesTableSchema, await readTable('variables'));

/** Every canonical spelling the spec knows, keyed by its lowercased lookup key. */
const known = new Map<string, string>(
	[...casing.values, ...includes.values].map((value) => [value.toLowerCase(), value]),
);

describe('tables validate against their schemas', () => {
	it('parses every table', () => {
		// The parses above would have thrown; this asserts they are non-empty.
		expect(casing.values.length).toBeGreaterThan(0);
		expect(includes.values.length).toBeGreaterThan(0);
		expect(parameters.global.length).toBeGreaterThan(0);
		expect(blocks.open.length).toBeGreaterThan(0);
		expect(variables.variables.length).toBeGreaterThan(0);
	});
});

describe('table invariants', () => {
	const tables = [
		['casing', casing.values],
		['includes', includes.values],
		['parameters.global', parameters.global],
		['parameters.globalPrefixes', parameters.globalPrefixes],
		['variables.variables', variables.variables],
		['variables.defines', variables.defines],
		['variables.langStrings', variables.langStrings],
	] as const;

	it.each(tables)('%s has no duplicate lookup keys', (_name, values) => {
		const keys = values.map((value) => value.toLowerCase());
		expect(keys).toHaveLength(new Set(keys).size);
	});

	it.each(tables)('%s is sorted case-insensitively', (_name, values) => {
		const sorted = [...values].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
		expect(values).toEqual(sorted);
	});

	it('assigns every block keyword exactly one role', () => {
		const seen = new Map<string, string>();

		// `v.parse` drops `$schema` along with every other unknown key, so `blocks` is roles only.
		for (const [role, keywords] of Object.entries(blocks)) {
			for (const keyword of keywords) {
				const previous = seen.get(keyword);
				expect(previous, `${keyword} is both "${previous}" and "${role}"`).toBeUndefined();
				seen.set(keyword, role);
			}
		}
	});

	it('knows the canonical casing of every block keyword', () => {
		for (const keyword of Object.values(blocks).flat()) {
			expect(known.get(keyword.toLowerCase()), `${keyword} missing from casing/includes`).toBe(keyword);
		}
	});

	it('scopes instruction parameters to known instructions', () => {
		for (const instruction of Object.keys(parameters.instruction)) {
			expect(known.has(instruction), `unknown instruction: ${instruction}`).toBe(true);
		}
	});
});

describe('vocabulary coverage', () => {
	/**
	 * `data/language.jsonc` is the NSIS vocabulary (what exists); this spec holds the style
	 * decisions (how it is printed). Every word in the vocabulary needs a casing entry,
	 * otherwise a newly added keyword would silently keep whatever casing an author typed.
	 */
	it('covers every keyword in data/language.jsonc', async () => {
		const path = join(root, '..', '..', 'data', 'language.jsonc');
		// Named keys rather than an index signature, so each lookup is `string[]`, not `string[] | undefined`.
		const language = JSONC.parse(await readFile(path, 'utf-8')) as Record<
			'keywords' | 'blocks' | 'compiler' | 'compilerBlocks',
			string[]
		>;

		const vocabulary = [...language.keywords, ...language.blocks, ...language.compiler, ...language.compilerBlocks];

		const missing = vocabulary.filter((word) => !known.has(word.toLowerCase()));

		expect(missing, `not in tables/casing.json: ${missing.join(', ')}`).toEqual([]);
	});
});
