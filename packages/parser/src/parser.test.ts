/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: NSIS definitions */
import { promises as fs } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import type { CommentNode, CSTNode, InstructionNode, LabelNode } from './parser.js';
import { parse } from './parser.js';

// --- Smoke tests: parse fixtures without throwing ---

test('Parses indentation fixture', async () => {
	const input = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/indentation.nsi'), 'utf8');
	const nodes = parse(input);
	expect(Array.isArray(nodes)).toBeTruthy();
	expect(nodes.length > 0).toBeTruthy();
});

test('Parses empty-lines fixture', async () => {
	const input = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/empty-lines.nsi'), 'utf8');
	const nodes = parse(input);
	expect(Array.isArray(nodes)).toBeTruthy();
	expect(nodes.length > 0).toBeTruthy();
});

// --- Blank lines ---

test('Blank lines produce blank nodes', () => {
	const nodes = parse('\n\n');
	expect(nodes.length).toBe(2);
	expect((nodes[0] as CSTNode).type).toBe('blank');
	expect((nodes[1] as CSTNode).type).toBe('blank');
});

test('Trailing whitespace at EOF is a blank node', () => {
	const nodes = parse('FunctionEnd\n    ');
	expect(nodes.length).toBe(2);
	expect((nodes[0] as InstructionNode).type).toBe('instruction');
	expect((nodes[0] as InstructionNode).keyword).toBe('FunctionEnd');
	expect((nodes[1] as CSTNode).type).toBe('blank');
});

// --- Comments ---

test('Hash comment', () => {
	const node = parse('# This is a comment\n')[0] as CommentNode;
	expect(node.type).toBe('comment');
	expect(node.style).toBe('hash');
	expect(node.value).toBe('This is a comment');
});

test('Semicolon comment', () => {
	const node = parse('; This is a comment\n')[0] as CommentNode;
	expect(node.type).toBe('comment');
	expect(node.style).toBe('semicolon');
	expect(node.value).toBe('This is a comment');
});

// --- Compiler commands ---

test('Compiler command with quoted arg', () => {
	const node = parse('!include "LogicLib.nsh"\n')[0] as InstructionNode;
	expect(node.type).toBe('instruction');
	expect(node.keyword).toBe('!include');
	expect(node.args).toEqual(['"LogicLib.nsh"']);
});

test('Compiler command conditional', () => {
	const node = parse('!if "true" == "true"\n')[0] as InstructionNode;
	expect(node.keyword).toBe('!if');
	expect(node.args).toEqual(['"true"', '==', '"true"']);
});

// --- LogicLib macros ---

test('LogicLib macro keyword', () => {
	const node = parse('${If} "true" == "true"\n')[0] as InstructionNode;
	expect(node.type).toBe('instruction');
	expect(node.keyword).toBe('${If}');
	expect(node.args).toEqual(['"true"', '==', '"true"']);
});

test('LogicLib macro without args', () => {
	const node = parse('${EndIf}\n')[0] as InstructionNode;
	expect(node.keyword).toBe('${EndIf}');
	expect(node.args).toEqual([]);
});

// --- Regular instructions ---

test('Instruction with quoted arg', () => {
	const node = parse('Name "demo"\n')[0] as InstructionNode;
	expect(node.type).toBe('instruction');
	expect(node.keyword).toBe('Name');
	expect(node.args).toEqual(['"demo"']);
});

test('Instruction with no args', () => {
	const node = parse('Nop\n')[0] as InstructionNode;
	expect(node.keyword).toBe('Nop');
	expect(node.args).toEqual([]);
});

test('Instruction with multiple args', () => {
	const node = parse('MessageBox MB_OK "Hello World"\n')[0] as InstructionNode;
	expect(node.keyword).toBe('MessageBox');
	expect(node.args).toEqual(['MB_OK', '"Hello World"']);
});

// --- Trailing comments ---

test('Instruction with trailing semicolon comment', () => {
	const node = parse('Nop ; do nothing\n')[0] as InstructionNode;
	expect(node.type).toBe('instruction');
	expect(node.comment).toBeTruthy();
	expect(node.comment?.style).toBe('semicolon');
	expect(node.comment?.value).toBe('do nothing');
});

test('Instruction with trailing hash comment', () => {
	const node = parse('Nop # do nothing\n')[0] as InstructionNode;
	expect(node.comment).toBeTruthy();
	expect(node.comment?.style).toBe('hash');
	expect(node.comment?.value).toBe('do nothing');
});

// --- Casing preservation ---

test('Keyword casing is preserved', () => {
	const node = parse('SECTION "test"\n')[0] as InstructionNode;
	expect(node.keyword).toBe('SECTION');
});

// --- Whitespace normalization ---

test('Leading whitespace is stripped from parsed keyword', () => {
	const node = parse('    Name "demo"\n')[0] as InstructionNode;
	expect(node.keyword).toBe('Name');
	expect(node.args).toEqual(['"demo"']);
});

test('Multiple spaces between args are not in parsed tokens', () => {
	const node = parse('MessageBox    MB_OK    "Hello"\n')[0] as InstructionNode;
	expect(node.args).toEqual(['MB_OK', '"Hello"']);
});

// --- Edge cases ---

test('File without trailing newline', () => {
	const nodes = parse('Nop');
	expect(nodes.length).toBe(1);
	expect((nodes[0] as InstructionNode).keyword).toBe('Nop');
});

test('Dot-prefixed function name', () => {
	const node = parse('Function .onInit\n')[0] as InstructionNode;
	expect(node.keyword).toBe('Function');
	expect(node.args).toEqual(['.onInit']);
});

test('Variable as argument', () => {
	const node = parse('${For} $0 1 5\n')[0] as InstructionNode;
	expect(node.keyword).toBe('${For}');
	expect(node.args).toEqual(['$0', '1', '5']);
});

test('Path with backslash in quoted string', () => {
	const node = parse('InstallDir "$PROGRAMFILES\\Demo"\n')[0] as InstructionNode;
	expect(node.keyword).toBe('InstallDir');
	expect(node.args).toEqual(['"$PROGRAMFILES\\Demo"']);
});

test('Adjacent quotes are two arguments, not an escape', () => {
	// `""` is not an escape: makensis closes the string at the second quote and
	// reads two tokens (`!echo "a""b"` fails with "expects 1 parameters, got 2").
	const node = parse('!echo "a""b"\n')[0] as InstructionNode;
	expect(node.keyword).toBe('!echo');
	expect(node.args).toEqual(['"a"', '"b"']);
});

test('Doubled quotes inside a single-quoted argument are literal', () => {
	const node = parse('nsExec::Exec \'ssm.exe -c ""$RootDir\\conf""\'\n')[0] as InstructionNode;
	expect(node.keyword).toBe('nsExec::Exec');
	expect(node.args).toEqual(['\'ssm.exe -c ""$RootDir\\conf""\'']);
});

test('Single-quoted string with escaped single quote', () => {
	const node = parse("DetailPrint 'Quote $\\'This$\\''\n")[0] as InstructionNode;
	expect(node.keyword).toBe('DetailPrint');
	expect(node.args).toEqual(["'Quote $\\'This$\\''"]);
});

test('Backtick string with escaped backtick', () => {
	const node = parse('DetailPrint `Quote $\\`This$\\``\n')[0] as InstructionNode;
	expect(node.keyword).toBe('DetailPrint');
	expect(node.args).toEqual(['`Quote $\\`This$\\``']);
});

// --- Unicode ---

test('Parses unicode fixture', async () => {
	const input = await fs.readFile(resolve(process.cwd(), 'tests/fixtures/unicode.nsi'), 'utf8');
	const nodes = parse(input);
	expect(Array.isArray(nodes)).toBeTruthy();
	expect(nodes.length > 0).toBeTruthy();
});

test('Unicode strings preserved in arguments', () => {
	const node = parse('DetailPrint "שלום, עולם!"\n')[0] as InstructionNode;
	expect(node.type).toBe('instruction');
	expect(node.args).toEqual(['"שלום, עולם!"']);
});

test('Multiple scripts in different languages', () => {
	const lines = [
		'DetailPrint "こんにちは、世界！"\n',
		'DetailPrint "привет, мир!"\n',
		'DetailPrint "안녕하세요!"\n',
		'DetailPrint "สวัสดีชาวโลก!"\n',
		'DetailPrint "Γεια σου, Κόσμε!"\n',
	];
	for (const line of lines) {
		const node = parse(line)[0] as InstructionNode;
		expect(node.type).toBe('instruction');
		expect(node.keyword).toBe('DetailPrint');
	}
});

test('BOM prefix is stripped', () => {
	const input = '﻿; BOM test\nDetailPrint "שלום"\n';
	const nodes = parse(input);
	expect(nodes.length > 0).toBeTruthy();
	const instr = nodes.find((n: CSTNode) => (n as InstructionNode).type === 'instruction') as InstructionNode;
	expect(instr.keyword).toBe('DetailPrint');
	expect(instr.args).toEqual(['"שלום"']);
});

// --- Strict keyword validation ---

test('Unknown keyword rejects', () => {
	expect(() => parse('FooBar "arg"\n')).toThrow();
});

test('Unknown compiler command rejects', () => {
	expect(() => parse('!foobar "arg"\n')).toThrow();
});

// --- Plugin calls ---

test('Plugin call keyword', () => {
	const node = parse('nsDialogs::Create /NOUNLOAD 1018\n')[0] as InstructionNode;
	expect(node.type).toBe('instruction');
	expect(node.keyword).toBe('nsDialogs::Create');
	expect(node.args).toEqual(['/NOUNLOAD', '1018']);
});

test('Plugin call with underscore prefix after ::', () => {
	const node = parse('nsProcess::_FindProcess "foo.exe"\n')[0] as InstructionNode;
	expect(node.type).toBe('instruction');
	expect(node.keyword).toBe('nsProcess::_FindProcess');
	expect(node.args).toEqual(['"foo.exe"']);
});

// --- Labels ---

test('Label line', () => {
	const node = parse('myLabel:\n')[0] as LabelNode;
	expect(node.type).toBe('label');
	expect(node.name).toBe('myLabel');
});

test('Label with trailing comment', () => {
	const node = parse('done: ; end of loop\n')[0] as LabelNode;
	expect(node.type).toBe('label');
	expect(node.name).toBe('done');
	expect(node.comment?.style).toBe('semicolon');
});

test('Label with instruction on same line', () => {
	const nodes = parse('Start: MessageBox MB_OK "Start:"\n');
	expect(nodes.length).toBe(2);
	expect((nodes[0] as LabelNode).type).toBe('label');
	expect((nodes[0] as LabelNode).name).toBe('Start');
	expect((nodes[1] as InstructionNode).type).toBe('instruction');
	expect((nodes[1] as InstructionNode).keyword).toBe('MessageBox');
	expect((nodes[1] as InstructionNode).args).toEqual(['MB_OK', '"Start:"']);
});

test('Macro keyword with underscores', () => {
	const node = parse('${__xpr} +2\n')[0] as InstructionNode;
	expect(node.type).toBe('instruction');
	expect(node.keyword).toBe('${__xpr}');
	expect(node.args).toEqual(['+2']);
});
