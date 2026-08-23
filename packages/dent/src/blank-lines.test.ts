import type { CSTNode } from '@nsis/parser';
import { expect, test } from 'vitest';
import { ensureBlankAroundBlocks, trimAndCollapseBlanks } from './blank-lines.ts';

const blank: CSTNode = { type: 'blank' };
const instr = (keyword: string): CSTNode => ({ type: 'instruction', keyword, args: [] });
const comment: CSTNode = { type: 'comment', style: 'semicolon', value: 'note' };
const label = (name: string): CSTNode => ({ type: 'label', name });

// --- ensureBlankAroundBlocks ---

test('ensureBlankAroundBlocks: inserts blank before block opener after instruction', () => {
	const nodes: CSTNode[] = [instr('Name'), instr('Section')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(3);
	expect(result[1].type).toBe('blank');
});

test('ensureBlankAroundBlocks: no blank between consecutive openers', () => {
	const nodes: CSTNode[] = [instr('Section'), instr('Function')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(2);
});

test('ensureBlankAroundBlocks: inserts blank after block closer before instruction', () => {
	const nodes: CSTNode[] = [instr('SectionEnd'), instr('Name')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(3);
	expect(result[1].type).toBe('blank');
});

test('ensureBlankAroundBlocks: inserts blank between closer and next opener', () => {
	const nodes: CSTNode[] = [instr('SectionEnd'), instr('Section')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(3);
	expect(result[1].type).toBe('blank');
});

test('ensureBlankAroundBlocks: no blank between closer and next closer', () => {
	const nodes: CSTNode[] = [instr('SectionEnd'), instr('FunctionEnd')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(2);
});

test('ensureBlankAroundBlocks: does not duplicate existing blank', () => {
	const nodes: CSTNode[] = [instr('Name'), blank, instr('Section')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(3);
});

test('ensureBlankAroundBlocks: comment before opener does not get blank between them', () => {
	const nodes: CSTNode[] = [comment, instr('Section')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(2);
});

test('ensureBlankAroundBlocks: inserts blank before comment leading into opener', () => {
	const nodes: CSTNode[] = [instr('Name'), comment, instr('Section')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(4);
	expect(result[1].type).toBe('blank');
});

test('ensureBlankAroundBlocks: case keyword treated as opener', () => {
	// biome-ignore lint/suspicious/noTemplateCurlyInString: NSIS definition
	const nodes: CSTNode[] = [instr('Name'), instr('${Case}')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(3);
	expect(result[1].type).toBe('blank');
});

test('ensureBlankAroundBlocks: empty input returns empty', () => {
	expect(ensureBlankAroundBlocks([])).toEqual([]);
});

test('ensureBlankAroundBlocks: single node returns unchanged', () => {
	const nodes: CSTNode[] = [instr('Name')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(1);
});

test('ensureBlankAroundBlocks: inserts blank before label after instruction', () => {
	const nodes: CSTNode[] = [instr('DetailPrint'), label('done')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(3);
	expect(result[1].type).toBe('blank');
});

test('ensureBlankAroundBlocks: does not duplicate existing blank before label', () => {
	const nodes: CSTNode[] = [instr('DetailPrint'), blank, label('done')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(3);
});

test('ensureBlankAroundBlocks: no blank between opener and label', () => {
	const nodes: CSTNode[] = [instr('Function'), label('done')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(2);
});

test('ensureBlankAroundBlocks: inserts blank before comment leading into label', () => {
	const nodes: CSTNode[] = [instr('DetailPrint'), comment, label('done')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.map((node) => node.type)).toEqual(['instruction', 'blank', 'comment', 'label']);
});

test('ensureBlankAroundBlocks: comment detached from label keeps its position', () => {
	const nodes: CSTNode[] = [instr('DetailPrint'), comment, blank, label('done')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.map((node) => node.type)).toEqual(['instruction', 'blank', 'comment', 'blank', 'label']);
});

test('ensureBlankAroundBlocks: no blank between adjacent labels', () => {
	const nodes: CSTNode[] = [label('retry'), label('again')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(2);
});

test('ensureBlankAroundBlocks: removes existing blank between adjacent labels', () => {
	const nodes: CSTNode[] = [label('retry'), blank, label('again')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.map((node) => node.type)).toEqual(['label', 'label']);
});

test('ensureBlankAroundBlocks: collapses a run of separated labels', () => {
	const nodes: CSTNode[] = [instr('DetailPrint'), blank, label('first'), blank, label('second'), blank, label('third')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.map((node) => node.type)).toEqual(['instruction', 'blank', 'label', 'label', 'label']);
});

test('ensureBlankAroundBlocks: comment between labels keeps the alias run', () => {
	const nodes: CSTNode[] = [label('retry'), comment, label('again')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.map((node) => node.type)).toEqual(['label', 'comment', 'label']);
});

test('ensureBlankAroundBlocks: comment between label and opener still gets a blank', () => {
	const nodes: CSTNode[] = [label('done'), comment, instr('Section')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.map((node) => node.type)).toEqual(['label', 'blank', 'comment', 'instruction']);
});

test('ensureBlankAroundBlocks: no blank after a label', () => {
	const nodes: CSTNode[] = [label('done'), instr('DetailPrint')];
	const result = ensureBlankAroundBlocks(nodes);
	expect(result.length).toBe(2);
});

// --- trimAndCollapseBlanks ---

test('trimAndCollapseBlanks: strips leading blanks', () => {
	const nodes: CSTNode[] = [blank, blank, instr('Name')];
	const result = trimAndCollapseBlanks(nodes);
	expect(result.length).toBe(1);
	expect(result[0].type).toBe('instruction');
});

test('trimAndCollapseBlanks: strips trailing blanks', () => {
	const nodes: CSTNode[] = [instr('Name'), blank, blank];
	const result = trimAndCollapseBlanks(nodes);
	expect(result.length).toBe(1);
});

test('trimAndCollapseBlanks: collapses consecutive blanks to one', () => {
	const nodes: CSTNode[] = [instr('Name'), blank, blank, blank, instr('Section')];
	const result = trimAndCollapseBlanks(nodes);
	expect(result.length).toBe(3);
	expect(result[1].type).toBe('blank');
});

test('trimAndCollapseBlanks: single blank between nodes is preserved', () => {
	const nodes: CSTNode[] = [instr('Name'), blank, instr('Section')];
	const result = trimAndCollapseBlanks(nodes);
	expect(result.length).toBe(3);
});

test('trimAndCollapseBlanks: empty input returns empty', () => {
	expect(trimAndCollapseBlanks([])).toEqual([]);
});

test('trimAndCollapseBlanks: all blanks returns empty', () => {
	expect(trimAndCollapseBlanks([blank, blank, blank])).toEqual([]);
});

test('trimAndCollapseBlanks: no blanks returns unchanged', () => {
	const nodes: CSTNode[] = [instr('Name'), instr('Section')];
	const result = trimAndCollapseBlanks(nodes);
	expect(result.length).toBe(2);
});
