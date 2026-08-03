import { describe, expect, it } from 'vitest';
import { unifiedDiff } from './diff.ts';

describe('unifiedDiff', () => {
	it('returns nothing for identical input', () => {
		expect(unifiedDiff('a.nsi', 'one\ntwo\n', 'one\ntwo\n')).toEqual([]);
	});

	it('emits git-style headers without timestamps', () => {
		const lines = unifiedDiff('a.nsi', 'one\n', 'two\n');

		expect(lines[0]).toBe('--- a/a.nsi');
		expect(lines[1]).toBe('+++ b/a.nsi');
	});

	it('omits the headers when the label is null', () => {
		const lines = unifiedDiff(null, 'one\n', 'two\n');

		expect(lines[0]).toBe('@@ -1 +1 @@');
	});

	it('renders a replacement hunk', () => {
		expect(unifiedDiff(null, 'one\ntwo\nthree\n', 'one\nTWO\nthree\n')).toEqual([
			'@@ -1,3 +1,3 @@',
			' one',
			'-two',
			'+TWO',
			' three',
		]);
	});

	it('keeps three lines of context around a hunk', () => {
		const original = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n');
		const formatted = original.replace('line 10', 'LINE 10');

		const lines = unifiedDiff(null, `${original}\n`, `${formatted}\n`);

		expect(lines[0]).toBe('@@ -8,7 +8,7 @@');
		expect(lines.slice(1)).toEqual([
			' line 7',
			' line 8',
			' line 9',
			'-line 10',
			'+LINE 10',
			' line 11',
			' line 12',
			' line 13',
		]);
	});

	it('splits distant changes into separate hunks', () => {
		const original = Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n');
		const formatted = original.replace('line 2', 'LINE 2').replace('line 25', 'LINE 25');

		const hunks = unifiedDiff(null, `${original}\n`, `${formatted}\n`).filter((line) => line.startsWith('@@'));

		expect(hunks).toEqual(['@@ -1,6 +1,6 @@', '@@ -23,7 +23,7 @@']);
	});

	it('merges changes that are within twice the context', () => {
		const original = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n');
		const formatted = original.replace('line 5', 'LINE 5').replace('line 10', 'LINE 10');

		const hunks = unifiedDiff(null, `${original}\n`, `${formatted}\n`).filter((line) => line.startsWith('@@'));

		expect(hunks).toEqual(['@@ -3,12 +3,12 @@']);
	});

	it('reports a pure insertion with a zero-length source range', () => {
		expect(unifiedDiff(null, '', 'one\n')).toEqual(['@@ -0,0 +1 @@', '+one']);
	});

	it('reports a missing trailing newline', () => {
		expect(unifiedDiff(null, 'one', 'one\n')).toEqual(['@@ -1 +1 @@', '-one', '\\ No newline at end of file', '+one']);
	});
});
