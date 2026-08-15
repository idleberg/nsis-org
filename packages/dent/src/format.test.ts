import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import { createFormatter } from './dent.ts';

test('Tab indentation', async () => {
	const { format } = createFormatter();

	const fixture = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/indentation.nsi'), 'utf8');

	const expected = await fs.readFile(resolve(process.cwd(), 'tests/expected/tab-indentation.nsi'), 'utf8');

	expect(format(fixture)).toBe(expected);
});

test('Explicit tab indentation', async () => {
	const { format } = createFormatter({
		useTabs: true,
	});

	const fixture = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/indentation.nsi'), 'utf8');

	const expected = await fs.readFile(resolve(process.cwd(), 'tests/expected/tab-indentation.nsi'), 'utf8');

	expect(format(fixture)).toBe(expected);
});

test('Space indentation', async () => {
	const { format } = createFormatter({
		useTabs: false,
	});

	const fixture = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/indentation.nsi'), 'utf8');

	const expected = await fs.readFile(resolve(process.cwd(), 'tests/expected/space-indentation.nsi'), 'utf8');

	expect(format(fixture)).toBe(expected);
});

test('Empty lines', async () => {
	const { format } = createFormatter();

	const fixture = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/empty-lines.nsi'), 'utf8');

	const expected = await fs.readFile(resolve(process.cwd(), 'tests/expected/empty-lines.nsi'), 'utf8');

	expect(format(fixture)).toBe(expected);
});

test('Explicit empty lines', async () => {
	const { format } = createFormatter({
		trimEmptyLines: true,
	});

	const fixture = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/empty-lines.nsi'), 'utf8');

	const expected = await fs.readFile(resolve(process.cwd(), 'tests/expected/empty-lines.nsi'), 'utf8');

	expect(format(fixture)).toBe(expected);
});

test('Quotes', async () => {
	const { format } = createFormatter();

	const fixture = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/quotes.nsi'), 'utf8');

	const expected = await fs.readFile(resolve(process.cwd(), 'tests/expected/quotes.nsi'), 'utf8');

	expect(format(fixture)).toBe(expected);
});

test('Built-in variable, define and language string casing', async () => {
	const { format } = createFormatter({ eol: 'lf' });

	const fixture = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/variables.nsi'), 'utf8');

	const expected = await fs.readFile(resolve(process.cwd(), 'tests/expected/variables.nsi'), 'utf8');

	expect(format(fixture)).toBe(expected);
});

test('Built-in variable casing is idempotent', async () => {
	const { format } = createFormatter({ eol: 'lf' });

	const fixture = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/variables.nsi'), 'utf8');

	expect(format(format(fixture))).toBe(format(fixture));
});
