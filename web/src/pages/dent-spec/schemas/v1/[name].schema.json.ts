/**
 * Serves the JSON Schemas of the Dent Style Specification at the URLs their `$id` claims:
 * `https://idleberg.github.io/nsis-org/dent-spec/schemas/v1/<name>.schema.json`.
 *
 * The files are read from the package rather than copied into `public/`, so the published
 * schemas can never drift from the ones the specification ships.
 *
 * The `v1` in the path is the schema major version: within it, schemas only ever gain
 * constraints' descriptions and new optional keys, so serving the latest v1 is safe. A future
 * v2 gets its own directory, and this one stays as it is.
 */

import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';

const schemasDir = join(dirname(createRequire(import.meta.url).resolve('@nsis/dent-spec/package.json')), 'schemas');

const SUFFIX = '.schema.json';

export const getStaticPaths: GetStaticPaths = async () => {
	const files = await readdir(schemasDir);

	return files
		.filter((file) => file.endsWith(SUFFIX))
		.map((file) => ({ params: { name: file.slice(0, -SUFFIX.length) } }));
};

export const GET: APIRoute = async ({ params }) => {
	const body = await readFile(join(schemasDir, `${params.name}${SUFFIX}`), 'utf-8');

	return new Response(body, {
		headers: {
			'content-type': 'application/schema+json; charset=utf-8',
		},
	});
};
