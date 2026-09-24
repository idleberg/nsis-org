/**
 * Converts the Valibot schemas in `src/schemas.ts` to JSON Schema under `schemas/`.
 *
 * The emitted JSON Schema is normative, so conversion must never silently drop an
 * unsupported action: `errorMode: 'throw'` makes an unconvertible schema fail the build.
 * Run with `--check` to verify the committed files are up to date (used in CI).
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toJsonSchema } from '@valibot/to-json-schema';
import { SCHEMA_BASE_URL, schemas } from '../src/schemas.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'schemas');
const check = process.argv.includes('--check');

const titles: Record<keyof typeof schemas, string> = {
	casing: 'Dent style casing table',
	includes: 'Dent style includes table',
	parameters: 'Dent style parameters table',
	variables: 'Dent style variables table',
	blocks: 'Dent style blocks table',
	options: 'Dent style formatter options',
};

await mkdir(outDir, { recursive: true });

let stale = 0;

for (const [name, schema] of Object.entries(schemas)) {
	const converted = toJsonSchema(schema, { errorMode: 'throw', target: 'draft-2020-12' });

	const { $schema, ...body } = converted;

	const document = {
		$schema,
		$id: `${SCHEMA_BASE_URL}/${name}.schema.json`,
		title: titles[name as keyof typeof schemas],
		...body,
	};

	const path = join(outDir, `${name}.schema.json`);
	const contents = `${JSON.stringify(document, null, '\t')}\n`;

	if (check) {
		const current = await readFile(path, 'utf-8').catch(() => '');

		if (current !== contents) {
			console.error(`✗ ${name}.schema.json is out of date — run \`npm run build:schemas\``);
			stale++;
		}

		continue;
	}

	await writeFile(path, contents);
	console.log(`✓ schemas/${name}.schema.json`);
}

if (stale > 0) {
	process.exit(1);
}

if (check) {
	console.log('✓ emitted schemas are up to date');
}
