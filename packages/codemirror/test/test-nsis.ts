import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileTests } from '@lezer/generator/test';
import { describe, it } from 'vitest';
import { parser } from '../src/parser.ts';
import {
	extendIdentifier,
	extendIdentifierLoose,
	specializeIdentifier,
	specializeIdentifierLoose,
} from '../src/specializers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const caseDir = path.join(__dirname, 'cases');

const looseParser = parser.configure({
	specializers: [
		{ from: specializeIdentifier, to: specializeIdentifierLoose },
		{ from: extendIdentifier, to: extendIdentifierLoose },
	],
});

for (const file of fs.readdirSync(caseDir)) {
	if (!/\.txt$/.test(file)) continue;
	const testParser = file === 'case-insensitive.txt' ? looseParser : parser;
	describe(file, () => {
		for (const { name, run } of fileTests(fs.readFileSync(path.join(caseDir, file), 'utf8'), file))
			it(name, () => run(testParser));
	});
}
