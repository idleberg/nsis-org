import type { Comment, CommentNode, CSTNode, InstructionNode, LabelNode } from '@nsis/parser';
import { ensureBlankAroundBlocks, trimAndCollapseBlanks } from './blank-lines.ts';
import { canonicalCasing } from './canonical-casing.ts';
import { canonicalIncludes } from './canonical-includes.ts';
import { builtinDefines } from './canonical-variables.ts';
import { groupPipes, isArithmeticKeyword, joinInstructionArgs, normalizeInstructionArgs } from './normalize.ts';
import { rules } from './rules.ts';

export type CommentStyle = 'hash' | 'semi';

export interface PrinterOptions {
	useTabs: boolean;
	indentSize: number;
	printWidth: number;
	singleQuote: boolean;
	trimEmptyLines: boolean;
	commentStyle: CommentStyle | undefined;
	eol: string;
}

/**
 * Renders a flat list of CST nodes back into formatted NSIS source text.
 *
 * Applies canonical keyword casing, whitespace normalisation,
 * blank-line collapsing, and stack-based indentation.
 */
export function print(nodes: CSTNode[], options: PrinterOptions): string {
	let level = 0;

	/**
	 * Stack of saved indent levels — pushed by every `open` keyword,
	 * popped by every `close` keyword. This makes nested blocks
	 * (including `${Switch}` inside `${Switch}`) work automatically
	 * without ad-hoc saved-level variables.
	 */
	const stack: number[] = [];

	const lines: string[] = [];
	let processed = ensureBlankAroundBlocks(nodes);
	if (options.trimEmptyLines) {
		processed = trimAndCollapseBlanks(processed);
	}

	for (const node of processed) {
		switch (node.type) {
			case 'blank':
				lines.push('');
				break;

			case 'comment':
				lines.push(printComment(node, level, options));
				break;

			case 'label':
				lines.push(printLabel(node, level, options));
				break;

			case 'instruction': {
				const kw = node.keyword.toLowerCase();

				if (rules.open.has(kw)) {
					// Print at current level, then push & indent
					lines.push(printInstruction(node, level, options));
					stack.push(level);
					level++;
				} else if (rules.case.has(kw)) {
					// Print one level inside parent, indent body one further
					const parentLevel = stack.length > 0 ? (stack[stack.length - 1] as number) : 0;
					const caseLevel = parentLevel + 1;
					lines.push(printInstruction(node, caseLevel, options));
					level = caseLevel + 1;
				} else if (rules.close.has(kw)) {
					// Pop to the opener's level, then print
					level = stack.length > 0 ? (stack.pop() as number) : 0;
					lines.push(printInstruction(node, level, options));
				} else if (rules.mid.has(kw)) {
					// Print at the opener's level (one back), keep depth the same
					const openerLevel = stack.length > 0 ? (stack[stack.length - 1] as number) : 0;
					lines.push(printInstruction(node, openerLevel, options));
				} else if (rules.closeAfter.has(kw)) {
					// Print at current level, then reset to parent's content level
					lines.push(printInstruction(node, level, options));
					level = (stack.length > 0 ? (stack[stack.length - 1] as number) : 0) + 1;
				} else {
					lines.push(printInstruction(node, level, options));
				}
				break;
			}
		}
	}

	return lines.join(options.eol) + options.eol;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function indentStr(level: number, options: PrinterOptions): string {
	const char = options.useTabs ? '\t' : ' '.repeat(options.indentSize);
	return char.repeat(level);
}

function printComment(node: CommentNode, level: number, options: PrinterOptions): string {
	const prefix = indentStr(level, options);

	if (node.style === 'block') {
		const lines = node.value.split(/\r?\n/);

		if (lines.length === 1) {
			return `${prefix}/*${node.value}*/`;
		}

		return lines
			.map((line, i) => {
				if (i === 0) return `${prefix}/*${line}`;
				if (i === lines.length - 1) return `${prefix}${line}*/`;
				if (line.trim() === '') return '';
				// The parser already made the line relative to the opening `/*`.
				return `${prefix}${line}`;
			})
			.join(options.eol);
	}

	return `${prefix}${markedComment(node.style, node.value, options)}`;
}

/**
 * Picks the marker for a single-line comment, honouring the `commentStyle` option and
 * falling back to whichever marker the comment was written with. Block comments never
 * reach this function.
 */
function commentMarker(style: CommentNode['style'], options: PrinterOptions): string {
	if (options.commentStyle) {
		return options.commentStyle === 'hash' ? '#' : ';';
	}

	return style === 'hash' ? '#' : ';';
}

function printLabel(node: LabelNode, level: number, options: PrinterOptions): string {
	let line = `${indentStr(level, options)}${node.name}:`;

	if (node.comment) {
		line += ` ${printTrailingComment(node.comment, options)}`;
	}

	return line;
}

function printInstruction(node: InstructionNode, level: number, options: PrinterOptions): string {
	const kwLower = node.keyword.toLowerCase();
	const keyword =
		canonicalCasing.get(kwLower) ?? canonicalIncludes.get(kwLower) ?? builtinDefines.get(kwLower) ?? node.keyword;
	const isArithmetic = isArithmeticKeyword(kwLower);
	const args = normalizeInstructionArgs(node.args, node.keyword, options.singleQuote);
	const indent = indentStr(level, options);

	if (options.printWidth > 0 && args.length > 0) {
		const trailing = node.comment ? printTrailingComment(node.comment, options) : undefined;
		return wrapInstruction(keyword, args, trailing, indent, isArithmetic, options);
	}

	const joined = joinInstructionArgs(args, node.keyword);
	const parts = args.length > 0 ? `${keyword} ${joined}` : keyword;
	let line = `${indent}${parts}`;

	if (node.comment) {
		line += ` ${printTrailingComment(node.comment, options)}`;
	}

	return line;
}

function printTrailingComment(comment: Comment, options: PrinterOptions): string {
	return markedComment(comment.style, comment.value, options);
}

/** An empty comment is just its marker, so it leaves no trailing space (§8). */
function markedComment(style: CommentNode['style'], value: string, options: PrinterOptions): string {
	const marker = commentMarker(style, options);
	return value ? `${marker} ${value}` : marker;
}

function wrapInstruction(
	keyword: string,
	args: string[],
	trailingComment: string | undefined,
	indent: string,
	isArithmetic: boolean,
	options: PrinterOptions,
): string {
	const joinFn = (tokens: string[]) => (isArithmetic ? tokens.join(' ') : joinInstructionArgs(tokens, keyword));
	const joined = joinFn(args);
	const singleLine = args.length > 0 ? `${indent}${keyword} ${joined}` : `${indent}${keyword}`;
	const fullLine = trailingComment ? `${singleLine} ${trailingComment}` : singleLine;

	if (width(fullLine) <= options.printWidth) {
		return fullLine;
	}

	const contIndent = indent + (options.useTabs ? '\t' : ' '.repeat(options.indentSize));
	const resultLines: string[] = [];
	let current = `${indent}${keyword}`;

	for (const arg of isArithmetic ? args : groupPipes(args)) {
		const candidate = `${current} ${arg}`;
		if (width(candidate) + 2 > options.printWidth && width(current) > width(indent)) {
			resultLines.push(`${current} \\`);
			current = `${contIndent}${arg}`;
		} else {
			current = candidate;
		}
	}

	if (trailingComment) {
		current = `${current} ${trailingComment}`;
	}
	resultLines.push(current);

	return resultLines.join(options.eol);
}

/** Line width in Unicode code points, not UTF-16 units, so an emoji counts once (§10). */
function width(text: string): number {
	return [...text].length;
}
