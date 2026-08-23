import type { CSTNode } from '@nsis/parser';
import { rules } from './rules.ts';

function isBlockOpen(node: CSTNode): boolean {
	if (node.type !== 'instruction') return false;
	const kw = node.keyword.toLowerCase();
	return rules.open.has(kw) || rules.case.has(kw);
}

function isBlockClose(node: CSTNode): boolean {
	return node.type === 'instruction' && rules.close.has(node.keyword.toLowerCase());
}

function isLabel(node: CSTNode): boolean {
	return node.type === 'label';
}

/**
 * Nodes that start a new visual chunk and therefore want a blank line above them.
 * Unlike block openers, labels get no blank line after them.
 */
function needsBlankBefore(node: CSTNode): boolean {
	return isBlockOpen(node) || isLabel(node);
}

/** Whether a blank line belongs between `prev` and the chunk-opening `node`. */
function wantsBlankBetween(prev: CSTNode, node: CSTNode): boolean {
	if (!needsBlankBefore(node)) return false;

	// A chunk that opens right inside another one, or right below its own
	// comment, stays attached to it.
	if (isBlockOpen(prev) || prev.type === 'comment') return false;

	// Adjacent labels are aliases and stay glued together, like adjacent
	// block openers.
	return !(isLabel(node) && isLabel(prev));
}

/**
 * Whether a comment sitting between `prev` and the chunk-opening `next` starts a
 * new chunk, and so wants a blank line above itself.
 */
function commentOpensChunk(prev: CSTNode, next: CSTNode): boolean {
	if (!needsBlankBefore(next)) return false;

	// A comment inside a run of label aliases documents the run; it does not
	// break it apart.
	return !(isLabel(prev) && isLabel(next));
}

/**
 * Applies the structural blank-line rules: a blank above every chunk opener
 * (block openers and labels), a blank below every block closer, and no blank
 * inside a run of label aliases.
 *
 * These rules are not governed by `trimEmptyLines`, which only controls the
 * generic pass in `trimAndCollapseBlanks`. Structural blanks are inserted and
 * the alias-run blank is removed even when trimming is off.
 */
export function ensureBlankAroundBlocks(nodes: CSTNode[]): CSTNode[] {
	const result: CSTNode[] = [];
	let prevNonBlank: CSTNode | undefined;

	for (let i = 0; i < nodes.length; i++) {
		const node = nodes[i] as CSTNode;

		// Consecutive labels are aliases for one jump target, so nothing may
		// separate them — not even a blank line the author wrote.
		if (isLabel(node) && prevNonBlank && isLabel(prevNonBlank)) {
			while (result.length > 0 && (result[result.length - 1] as CSTNode).type === 'blank') {
				result.pop();
			}
		}

		const lastIsBlank = result.length > 0 && (result[result.length - 1] as CSTNode).type === 'blank';

		if (prevNonBlank && !lastIsBlank && node.type !== 'blank') {
			if (wantsBlankBetween(prevNonBlank, node)) {
				result.push({ type: 'blank' });
			} else if (node.type === 'comment' && !isBlockOpen(prevNonBlank) && prevNonBlank.type !== 'comment') {
				let j = i + 1;
				while (j < nodes.length && ((nodes[j] as CSTNode).type === 'blank' || (nodes[j] as CSTNode).type === 'comment'))
					j++;
				if (j < nodes.length && commentOpensChunk(prevNonBlank, nodes[j] as CSTNode)) {
					result.push({ type: 'blank' });
				}
			} else if (isBlockClose(prevNonBlank) && !isBlockClose(node) && !isBlockOpen(node)) {
				result.push({ type: 'blank' });
			}
		}

		result.push(node);
		if (node.type !== 'blank') {
			prevNonBlank = node;
		}
	}

	return result;
}

export function trimAndCollapseBlanks(nodes: CSTNode[]): CSTNode[] {
	let start = 0;
	while (start < nodes.length && (nodes[start] as CSTNode).type === 'blank') start++;

	let end = nodes.length - 1;
	while (end >= start && (nodes[end] as CSTNode).type === 'blank') end--;

	const result: CSTNode[] = [];
	let prevBlank = false;

	for (let i = start; i <= end; i++) {
		const node = nodes[i] as CSTNode;
		if (node.type === 'blank') {
			if (!prevBlank) {
				result.push(node);
				prevBlank = true;
			}
		} else {
			result.push(node);
			prevBlank = false;
		}
	}

	return result;
}
