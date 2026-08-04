import { beforeAll, describe, expect, it } from 'vitest';

type TokenPattern = RegExp | { pattern: RegExp; lookbehind?: boolean; greedy?: boolean };

const Prism = {
	languages: {} as Record<string, Record<string, TokenPattern>>,
};

let grammar: Record<string, TokenPattern>;

function patternOf(token: string): RegExp {
	const value = grammar[token];

	if (!value) {
		throw new Error(`Unknown token: ${token}`);
	}

	return value instanceof RegExp ? value : value.pattern;
}

beforeAll(async () => {
	Object.assign(globalThis, { Prism });
	await import('./nsis.ts');

	grammar = Prism.languages.nsis as Record<string, TokenPattern>;
});

describe('macros', () => {
	it('expands every placeholder at build time', () => {
		for (const token of Object.keys(grammar)) {
			expect(String(patternOf(token))).not.toContain('%NSIS_');
		}
	});
});

describe('keyword', () => {
	it('matches instructions', () => {
		expect(patternOf('keyword').test('OutFile "setup.exe"')).toBe(true);
	});

	it('matches blocks', () => {
		expect(patternOf('keyword').test('  Section "Install"')).toBe(true);
		expect(patternOf('keyword').test('FunctionEnd')).toBe(true);
	});

	it('matches on any line', () => {
		expect(patternOf('keyword').test('Name "Example"\n\tOutFile "setup.exe"')).toBe(true);
	});

	it('does not match unknown words', () => {
		expect(patternOf('keyword').test('NotAnInstruction')).toBe(false);
	});

	it('is case-sensitive', () => {
		expect(patternOf('keyword').test('outfile "setup.exe"')).toBe(false);
	});
});

describe('property', () => {
	it('matches properties', () => {
		expect(patternOf('property').test('SetCompressor zlib')).toBe(true);
		expect(patternOf('property').test('RequestExecutionLevel admin')).toBe(true);
	});

	it('does not match unknown words', () => {
		expect(patternOf('property').test('RequestExecutionLevel nobody')).toBe(false);
	});
});

describe('important', () => {
	it('matches compiler commands', () => {
		expect(patternOf('important').test('!include LogicLib.nsh')).toBe(true);
	});

	it('matches compiler blocks', () => {
		expect(patternOf('important').test('!macroend')).toBe(true);
	});

	it('is case-insensitive', () => {
		expect(patternOf('important').test('!INCLUDE LogicLib.nsh')).toBe(true);
	});

	it('does not match unknown commands', () => {
		expect(patternOf('important').test('!nope')).toBe(false);
	});
});
