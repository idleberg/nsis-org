/**
 * Generates Dent's lookup tables from `@nsis/dent-spec`.
 *
 * The spec owns the data; this script only emits the TypeScript form of it. Run it after
 * upgrading the spec, and commit the result. `--check` verifies the committed files are in
 * step with the installed spec version (used by `pretest` and CI).
 */

import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type CanonicalTable = { values: string[] };
type ParametersTable = {
	global: string[];
	globalPrefixes: string[];
	instruction: Record<string, string[]>;
};
type VariablesTable = { variables: string[]; defines: string[]; langStrings: string[] };
type BlocksTable = Record<'open' | 'case' | 'close' | 'mid' | 'closeAfter', string[]>;

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src');
const check = process.argv.includes('--check');

/** Resolved through the dependency, so it works from a workspace link or from node_modules. */
const specDir = dirname(createRequire(import.meta.url).resolve('@nsis/dent-spec/package.json'));

const BIOME_IGNORE = '/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: NSIS definitions */';

async function table<T>(name: string): Promise<T> {
	return JSON.parse(await readFile(join(specDir, 'tables', `${name}.json`), 'utf-8')) as T;
}

const specVersion = JSON.parse(await readFile(join(specDir, 'package.json'), 'utf-8')).version;

const casing = await table<CanonicalTable>('casing');
const includes = await table<CanonicalTable>('includes');
const parameters = await table<ParametersTable>('parameters');
const variables = await table<VariablesTable>('variables');
const blocks = await table<BlocksTable>('blocks');

function header(description: string): string {
	return [
		BIOME_IGNORE,
		'',
		'/**',
		` * ${description}`,
		' *',
		` * Generated from @nsis/dent-spec ${specVersion} by \`npm run codegen\` — do not edit.`,
		' */',
		'',
	].join('\n');
}

/** A `Map` literal keyed by the lowercased spelling, as every lookup in Dent is case-insensitive. */
function mapLiteral(name: string, values: string[]): string {
	const entries = values.map((value) => `\t[${quote(value.toLowerCase())}, ${quote(value)}],`);

	return `export const ${name}: Map<string, string> = new Map([\n${entries.join('\n')}\n]);\n`;
}

function setLiteral(values: string[]): string {
	return `new Set([\n${values.map((value) => `\t\t${quote(value.toLowerCase())},`).join('\n')}\n\t])`;
}

function quote(value: string): string {
	return `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
}

const files: Record<string, string> = {
	'canonical-casing.ts':
		header('Maps lowercased NSIS instructions and compiler commands to their canonical casing.') +
		'\n' +
		mapLiteral('canonicalCasing', casing.values),

	'canonical-includes.ts':
		header('Maps lowercased macros of the NSIS bundled include libraries to their canonical casing.') +
		'\n' +
		mapLiteral('canonicalIncludes', includes.values),

	'canonical-variables.ts':
		header('Maps lowercased NSIS built-in variables, defines and language strings to their canonical casing.') +
		'\n' +
		[
			mapLiteral('builtinVariables', variables.variables),
			mapLiteral('builtinDefines', variables.defines),
			mapLiteral('builtinLangStrings', variables.langStrings),
		].join('\n'),

	'canonical-parameters.ts':
		header('Maps lowercased instruction parameters to their canonical casing.') +
		'\n' +
		[
			mapLiteral('globalParameters', parameters.global),
			mapLiteral('globalParameterPrefixes', parameters.globalPrefixes),
			`export const instructionParameters: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map([\n${Object.entries(
				parameters.instruction,
			)
				.map(
					([instruction, values]) =>
						`\t[\n\t\t${quote(instruction)},\n\t\tnew Map([\n${values
							.map((value) => `\t\t\t[${quote(value.toLowerCase())}, ${quote(value)}],`)
							.join('\n')}\n\t\t]),\n\t],`,
				)
				.join('\n')}\n]);\n`,
		].join('\n'),

	'rules.ts':
		header('Keyword roles that drive indentation, as defined by the Dent Style Specification.') +
		`
/**
 * Keyword roles for indentation.
 *
 * - **open**  — printed at the *current* level, then level increases.
 * - **close** — level decreases first, then printed at the new level.
 * - **case**  — printed one level inside the parent, body one level further.
 * - **mid**   — printed one level *back* (like the opening keyword),
 *               but the level stays the same (e.g. \`\${Else}\`, \`!else\`).
 * - **closeAfter** — printed at the *current* level, then level decreases
 *               (e.g. \`\${Break}\`).
 */
export const rules = {
	/** Keywords that open a block (indent children). */
	open: ${setLiteral(blocks.open)},
	/** Case arms within a switch or select block. */
	case: ${setLiteral(blocks.case)},
	/** Keywords that close a block (dedent themselves). */
	close: ${setLiteral(blocks.close)},
	/** Keywords printed at the opener's level without changing depth. */
	mid: ${setLiteral(blocks.mid)},
	/** Keywords printed at the current level that then dedent. */
	closeAfter: ${setLiteral(blocks.closeAfter)},
};
`,
};

let stale = 0;

for (const [name, contents] of Object.entries(files)) {
	const path = join(srcDir, name);

	if (check) {
		const current = await readFile(path, 'utf-8').catch(() => '');

		if (current !== contents) {
			console.error(`✗ src/${name} is out of date — run \`npm run codegen\``);
			stale++;
		}

		continue;
	}

	await writeFile(path, contents);
	console.log(`✓ src/${name}`);
}

if (stale > 0) {
	process.exit(1);
}

if (check) {
	console.log(`✓ tables are in step with @nsis/dent-spec ${specVersion}`);
}
