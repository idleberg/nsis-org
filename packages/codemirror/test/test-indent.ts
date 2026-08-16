/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: NSIS macro references */

import { getIndentation } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { nsis } from '../src/index.ts';

function indentAt(doc: string, lineNumber: number): number | null {
	const state = EditorState.create({
		doc,
		extensions: [nsis()],
	});
	const line = state.doc.line(lineNumber);
	return getIndentation(state, line.from);
}

describe('indentation', () => {
	it('indents body of Section block', () => {
		expect(indentAt('Section\n\nSectionEnd', 2)).toBe(2);
	});

	it('indents body of Section block with argument', () => {
		expect(indentAt('Section Name\n\nSectionEnd', 2)).toBe(2);
	});

	it('indents body of Section block with string argument', () => {
		expect(indentAt('Section "Install"\n\nSectionEnd', 2)).toBe(2);
	});

	it('does not indent SectionEnd', () => {
		expect(indentAt('Section\n  Nop\nSectionEnd', 3)).toBe(0);
	});

	it('does not indent SectionEnd with argument on Section', () => {
		expect(indentAt('Section Name\n  Nop\nSectionEnd', 3)).toBe(0);
	});

	it('indents body of Function block', () => {
		expect(indentAt('Function .onInit\n\nFunctionEnd', 2)).toBe(2);
	});

	it('does not indent FunctionEnd', () => {
		expect(indentAt('Function .onInit\n  Nop\nFunctionEnd', 3)).toBe(0);
	});

	it('indents body of SectionGroup block', () => {
		expect(indentAt('SectionGroup "Group"\n\nSectionGroupEnd', 2)).toBe(2);
	});

	it('does not indent SectionGroupEnd', () => {
		expect(indentAt('SectionGroup "Group"\n  Nop\nSectionGroupEnd', 3)).toBe(0);
	});

	it('indents body of PageEx block', () => {
		expect(indentAt('PageEx license\n\nPageExEnd', 2)).toBe(2);
	});

	it('does not indent PageExEnd', () => {
		expect(indentAt('PageEx license\n  Nop\nPageExEnd', 3)).toBe(0);
	});

	it('indents body of !macro block', () => {
		expect(indentAt('!macro MyMacro\n\nSectionEnd', 2)).toBe(2);
	});

	it('does not indent !macroend', () => {
		expect(indentAt('!macro MyMacro\n  Nop\n!macroend', 3)).toBe(0);
	});

	it('indents body of !ifdef block', () => {
		expect(indentAt('!ifdef DEBUG\n\n!endif', 2)).toBe(2);
	});

	it('does not indent !endif', () => {
		expect(indentAt('!ifdef DEBUG\n  Nop\n!endif', 3)).toBe(0);
	});

	it('does not indent !else', () => {
		expect(indentAt('!ifdef DEBUG\n  Nop\n!else', 3)).toBe(0);
	});

	it('indents body of ${If} block', () => {
		expect(indentAt('${If} $0 == 1\n\n${EndIf}', 2)).toBe(2);
	});

	it('does not indent ${EndIf}', () => {
		expect(indentAt('${If} $0 == 1\n  Nop\n${EndIf}', 3)).toBe(0);
	});

	it('does not indent ${Else}', () => {
		expect(indentAt('${If} $0 == 1\n  Nop\n${Else}', 3)).toBe(0);
	});

	it('does not indent ${LoopUntil}', () => {
		expect(indentAt('${Do}\n  Nop\n${LoopUntil} $0 <= 0', 3)).toBe(0);
	});

	it('indents ${If} block nested in a Section', () => {
		expect(indentAt('Section "x"\n  ${If} $0 == 1\n\n  ${EndIf}\nSectionEnd', 3)).toBe(4);
	});
});
