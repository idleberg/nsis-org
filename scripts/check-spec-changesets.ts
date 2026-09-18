/**
 * Guards the coupling between `@nsis/dent-spec` and its implementations.
 *
 * `@nsis/dent` generates its tables from the spec and is tested against its cases, so a spec
 * release that changes output must not reach users as a Dent patch. Whenever a changeset bumps
 * `@nsis/dent-spec`, some changeset in the same batch must bump `@nsis/dent` by at least as
 * much.
 *
 * Changesets' own `updateInternalDependencies` only bumps dependents of runtime dependencies,
 * and the spec is a devDependency, so nothing enforces this for us.
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const changesetDir = join(dirname(fileURLToPath(import.meta.url)), '..', '.changeset');

const RANK = { patch: 1, minor: 2, major: 3 } as const;
type Bump = keyof typeof RANK;

const SPEC = '@nsis/dent-spec';
const IMPLEMENTATION = '@nsis/dent';

/** Highest bump each package receives across every changeset. */
const bumps = new Map<string, Bump>();

for (const file of await readdir(changesetDir)) {
	if (!file.endsWith('.md') || file === 'README.md') continue;

	const contents = await readFile(join(changesetDir, file), 'utf-8');
	const frontmatter = /^---\n([\s\S]*?)\n---/.exec(contents);

	if (!frontmatter) continue;

	for (const line of (frontmatter[1] as string).split('\n')) {
		const match = /^\s*['"]?(@?[\w./-]+)['"]?\s*:\s*(patch|minor|major)\s*$/.exec(line);
		if (!match) continue;

		const [, name, bump] = match as unknown as [string, string, Bump];
		const current = bumps.get(name);

		if (!current || RANK[bump] > RANK[current]) {
			bumps.set(name, bump);
		}
	}
}

const specBump = bumps.get(SPEC);

if (!specBump) {
	console.log(`✓ no ${SPEC} changeset in this batch`);
	process.exit(0);
}

const implementationBump = bumps.get(IMPLEMENTATION);

if (!implementationBump) {
	console.error(
		`✗ ${SPEC} is bumped (${specBump}) but ${IMPLEMENTATION} is not.\n` +
			`  ${IMPLEMENTATION} generates its tables from the spec and is tested against its cases, ` +
			`so it must be released alongside it.\n  Add a changeset for ${IMPLEMENTATION} of at least "${specBump}".`,
	);
	process.exit(1);
}

if (RANK[implementationBump] < RANK[specBump]) {
	console.error(
		`✗ ${SPEC} is bumped ${specBump}, but ${IMPLEMENTATION} only ${implementationBump}.\n` +
			'  A spec change that alters output must not ship as a smaller bump downstream.\n' +
			`  Raise the ${IMPLEMENTATION} changeset to "${specBump}".`,
	);
	process.exit(1);
}

console.log(`✓ ${SPEC} ${specBump} is matched by ${IMPLEMENTATION} ${implementationBump}`);
