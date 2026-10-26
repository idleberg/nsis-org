import fs from 'node:fs';
import path from 'node:path';
import { tokenize } from '@twinkleplop/core';
import { verify } from '@twinkleplop/core/compile';
import { describe, expect, it, test } from 'vitest';
import { grammar, tokenize as make_language, raw_grammar } from './index.ts';

const test_path = path.join(import.meta.dirname, '..', 'tests');

const input_files = fs
	.readdirSync(test_path)
	.filter((file) => file.endsWith('.nsi'))
	.sort();

function get_tokens(input: string) {
	const result = tokenize(input, grammar);
	const tokens = [];
	for (let i = 0; i < result.tokens.length / 3; i++) {
		const type = result.token_types[result.tokens[i * 3]];
		const start = result.tokens[i * 3 + 1];
		const end = result.tokens[i * 3 + 2];
		const match = input.substring(start, end);
		tokens.push({ type, start, end, match });
	}
	return tokens;
}

describe('NSIS Grammar', () => {
	test('verify', () => {
		const issues = verify(raw_grammar);
		expect(issues).toEqual([]);
	});

	// `vitest -u` rewrites the snapshots
	for (const file of input_files) {
		it(`should tokenize ${file}`, async () => {
			const tokens = get_tokens(fs.readFileSync(path.join(test_path, file), 'utf-8'));
			await expect(`${JSON.stringify(tokens, null, '\t')}\n`).toMatchFileSnapshot(
				path.join(test_path, file.replace('.nsi', '.tokens.json')),
			);
		});
	}
});

const shape = (input: string) => get_tokens(input).map(({ type, match }) => [type, match]);

const language = make_language();

function classify(input: string) {
	const result = language(input);
	const out: [string, string][] = [];
	for (let i = 0; i < result.tokens.length / 3; i++) {
		const start = result.tokens[i * 3 + 1];
		const end = result.tokens[i * 3 + 2];
		out.push([result.token_types[result.tokens[i * 3]], input.slice(start, end)]);
	}
	return out;
}

describe('NSIS line handling', () => {
	test('every construct repeated past the stack size tokenizes like the first', () => {
		const block = [
			'!define /ifndef NAME "x" ; c',
			'DetailPrint "a $INSTDIR ${If} $(^Name) $$ $\\n end"',
			"StrCpy $0 can't",
			'IntOp $0 $0 / 2',
			'File /oname=$PLUGINSDIR\\a.ini a.ini',
			'MessageBox MB_OK \\',
			"  'next' IDOK +2",
			'label:',
			'',
		].join('\n');
		const first = shape(block);
		const many = shape(block.repeat(300));
		expect(many.slice(-first.length)).toEqual(first);
	});

	test('CRLF line endings tokenize like LF', () => {
		const lf = ['Name foo ; c', 'MessageBox MB_OK \\', '  "x"', 'done:'].join('\n') + '\n';
		const crlf = lf.replace(/\n/g, '\r\n');
		expect(shape(crlf).map(([type]) => type)).toEqual(shape(lf).map(([type]) => type));
	});

	test('input may end inside any construct', () => {
		expect(shape('Name "open')).toEqual([
			['identifier', 'Name'],
			['string', '"open'],
		]);
		expect(shape('Name ${open')).toEqual([
			['identifier', 'Name'],
			['constant', '${open'],
		]);
		expect(shape('File /')).toEqual([
			['identifier', 'File'],
			['operator', '/'],
		]);
		expect(shape('Goto -')).toEqual([
			['identifier', 'Goto'],
			['operator', '-'],
		]);
	});
});

describe('NSIS reclassifier', () => {
	test('instructions count case-insensitively at the head of a line only', () => {
		expect(classify('messagebox MB_OK Name\n  DetailPrint x')).toEqual([
			['keyword', 'messagebox'],
			['constant', 'MB_OK'],
			['identifier', 'Name'],
			['keyword', 'DetailPrint'],
			['identifier', 'x'],
		]);
	});

	test('a continued line has no head', () => {
		expect(classify('StrCpy $0 \\\nName')).toEqual([
			['keyword', 'StrCpy'],
			['variable', '$0'],
			['punctuation', '\\\n'],
			['identifier', 'Name'],
		]);
	});

	test('declarations name what follows them', () => {
		expect(classify('Function .onInit\n!macro Foo\n!define /ifndef BAR 1\nVar /GLOBAL baz')).toEqual([
			['keyword', 'Function'],
			['function', '.onInit'],
			['keyword', '!macro'],
			['function', 'Foo'],
			['keyword', '!define'],
			['parameter', '/ifndef'],
			['constant', 'BAR'],
			['number', '1'],
			['keyword', 'Var'],
			['parameter', '/GLOBAL'],
			['variable', 'baz'],
		]);
	});

	test('labels, plugin calls and !else branches', () => {
		expect(classify('done:\nnsDialogs::Create 1018\n!else ifndef X')).toEqual([
			['label', 'done:'],
			['function', 'nsDialogs::Create'],
			['number', '1018'],
			['keyword', '!else'],
			['keyword', 'ifndef'],
			['identifier', 'X'],
		]);
	});

	test('built-in names, include macros and LogicLib', () => {
		expect(classify('${If} $instdir == "${NSISDIR}"\n${GetParameters} $R0\n${EndIf}')).toEqual([
			['keyword', '${If}'],
			['builtin', '$instdir'],
			['operator', '=='],
			['string', '"'],
			['builtin', '${NSISDIR}'],
			['string', '"'],
			['function', '${GetParameters}'],
			['variable', '$R0'],
			['keyword', '${EndIf}'],
		]);
	});

	test('constants and booleans in arguments', () => {
		expect(classify('SetCompressor /SOLID LZMA\nUnicode On\nPage un.instfiles')).toEqual([
			['keyword', 'SetCompressor'],
			['parameter', '/SOLID'],
			['constant', 'LZMA'],
			['keyword', 'Unicode'],
			['boolean', 'On'],
			['keyword', 'Page'],
			['constant', 'un.instfiles'],
		]);
	});
});
