import { parse as peggyParse } from './grammar.js';

export type Comment = {
	style: 'hash' | 'semicolon';
	value: string;
};

export type BlankNode = {
	type: 'blank';
};

export type CommentNode = {
	type: 'comment';
	style: 'hash' | 'semicolon' | 'block';
	value: string;
};

export type InstructionNode = {
	type: 'instruction';
	keyword: string;
	args: string[];
	comment?: Comment;
};

export type LabelNode = {
	type: 'label';
	name: string;
	comment?: Comment;
};

export type CSTNode = BlankNode | CommentNode | InstructionNode | LabelNode;

const CONTINUATION = /\\[ \t]*\r?\n[ \t]*/g;

type Position = { offset: number; line: number; column: number };

/**
 * Strips a leading BOM and joins backslash-continued lines.
 *
 * Alongside the preprocessed text this returns a list of `[preprocessedOffset, sourceOffset]`
 * pairs marking the start of every run of characters copied verbatim. Joining a continuation
 * drops a newline, so without this map every position reported after the first `\`
 * continuation is off by one line per continuation.
 */
function preprocess(source: string): { text: string; segments: Array<[number, number]> } {
	const segments: Array<[number, number]> = [[0, 0]];
	let text = '';
	let cursor = 0;

	for (const match of source.matchAll(CONTINUATION)) {
		text += source.slice(cursor, match.index);
		// The injected space stands in for the whole continuation, so anchor it to the
		// backslash that started it.
		segments.push([text.length, match.index]);
		text += ' ';
		cursor = match.index + match[0].length;
		segments.push([text.length, cursor]);
	}

	text += source.slice(cursor);

	return { text, segments };
}

/** Translates a preprocessed offset back to a position in the original source. */
function sourcePosition(source: string, segments: Array<[number, number]>, offset: number): Position {
	let index = 0;
	while (index + 1 < segments.length && segments[index + 1][0] <= offset) {
		index++;
	}

	const [preprocessedStart, sourceStart] = segments[index];
	const position = Math.min(sourceStart + (offset - preprocessedStart), source.length);
	const before = source.slice(0, position);
	const lastNewline = before.lastIndexOf('\n');

	return { offset: position, line: before.split('\n').length, column: position - lastNewline };
}

/**
 * Parses NSIS source text into a flat list of CST nodes.
 *
 * @param input - The NSIS source code to parse.
 * @returns An array of CST nodes, one per logical line.
 * @throws {SyntaxError} If the input cannot be parsed.
 */
export function parse(input: string): CSTNode[] {
	const source = input.replace(/^\uFEFF/, '');
	const { text, segments } = preprocess(source);

	try {
		return peggyParse(text) as CSTNode[];
	} catch (error) {
		if (error instanceof SyntaxError && 'location' in error) {
			const location = (error as SyntaxError & { location: { start: Position; end: Position } }).location;
			location.start = sourcePosition(source, segments, location.start.offset);
			location.end = sourcePosition(source, segments, location.end.offset);
		}
		throw error;
	}
}
