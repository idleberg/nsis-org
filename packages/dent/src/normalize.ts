import { canonicalIncludes } from './canonical-includes.ts';
import { globalParameterPrefixes, globalParameters, instructionParameters } from './canonical-parameters.ts';
import { builtinDefines, builtinLangStrings, builtinVariables } from './canonical-variables.ts';

const arithmeticInstructions = new Set(['intop', 'intptrop']);

export function normalizeInstructionArgs(args: string[], keyword: string, singleQuote: boolean): string[] {
	const kwLower = keyword.toLowerCase();
	const instrParams = instructionParameters.get(kwLower);
	const isArithmetic = arithmeticInstructions.has(kwLower);
	const split = isArithmetic ? splitArithmeticTokens(args) : splitPipeTokens(args);
	return split.map((arg) => normalizeArg(arg, instrParams, singleQuote));
}

export function isArithmeticKeyword(keyword: string): boolean {
	return arithmeticInstructions.has(keyword.toLowerCase());
}

export function joinInstructionArgs(args: string[], keyword: string): string {
	return isArithmeticKeyword(keyword) ? args.join(' ') : joinWithCompactPipes(args);
}

export function normalizeQuotes(arg: string, singleQuote: boolean): string {
	const stripped = stripQuoteDelimiters(arg);
	if (!stripped) return arg;

	const [, inner] = stripped;
	const target = singleQuote ? "'" : '"';
	const content = unescapeInner(inner);

	const hasDouble = content.includes('"');
	const hasSingle = content.includes("'");
	const hasBacktick = content.includes('`');

	if (!hasDouble && !hasSingle) {
		return target === '"' ? `"${content}"` : `'${content}'`;
	}

	const hasTarget = target === '"' ? hasDouble : hasSingle;

	if (!hasTarget) {
		return target === '"' ? `"${content}"` : `'${content}'`;
	}

	const alt = target === '"' ? "'" : '"';
	const hasAlt = alt === '"' ? hasDouble : hasSingle;

	if (!hasAlt) {
		return alt === '"' ? `"${content}"` : `'${content}'`;
	}

	if (!hasBacktick) {
		return `\`${content}\``;
	}

	return `"${escapeForDouble(content)}"`;
}

const IDENTIFIER_CHAR = /[A-Za-z0-9_]/;

/**
 * Returns the index just past the delimiter closing a `$`-group starting at `start`, where
 * `start` points at the `$`. Handles nested groups of the same kind.
 */
function findGroupEnd(text: string, start: number, open: string, close: string): number | undefined {
	let depth = 1;
	let i = start + 2;

	while (i < text.length) {
		if (text[i] === '$' && text[i + 1] === open) {
			depth += 1;
			i += 2;
			continue;
		}

		if (text[i] === close) {
			depth -= 1;
			if (depth === 0) return i + 1;
		}

		i++;
	}

	return undefined;
}

/**
 * Rewrites NSIS built-in variables (`$instdir`), defines (`${nsisdir}`) and language strings
 * (`$(^name)`) to their canonical casing, leaving custom names, environment variables and
 * escape sequences untouched.
 */
export function normalizeVariables(text: string): string {
	let result = '';
	let i = 0;

	while (i < text.length) {
		if (text[i] !== '$') {
			const start = i;
			while (i < text.length && text[i] !== '$') i++;
			result += text.slice(start, i);
			continue;
		}

		const next = text[i + 1];

		// Escape sequences: $$, $\n, $\r, $\t, $\", $\', $\`
		if (next === '$' || next === '\\') {
			result += text.slice(i, i + 2);
			i += 2;
			continue;
		}

		if (next === '{') {
			const end = findGroupEnd(text, i, '{', '}');
			if (end === undefined) {
				result += text.slice(i);
				break;
			}

			const group = text.slice(i, end);
			const lower = group.toLowerCase();
			result += builtinDefines.get(lower) ?? canonicalIncludes.get(lower) ?? group;
			i = end;
			continue;
		}

		if (next === '(') {
			const end = findGroupEnd(text, i, '(', ')');
			if (end === undefined) {
				result += text.slice(i);
				break;
			}

			const inner = text.slice(i + 2, end - 1);
			const canonical = inner.startsWith('^') ? builtinLangStrings.get(inner.toLowerCase()) : undefined;
			result += canonical === undefined ? text.slice(i, end) : `$(${canonical})`;
			i = end;
			continue;
		}

		// Environment variables — the names are not ours to normalize
		if (next === '%') {
			const closing = text.indexOf('%', i + 2);
			const end = closing === -1 ? text.length : closing + 1;
			result += text.slice(i, end);
			i = end;
			continue;
		}

		const start = i + 1;
		let end = start;
		while (end < text.length && IDENTIFIER_CHAR.test(text[end] as string)) end++;

		if (end === start) {
			result += '$';
			i++;
			continue;
		}

		const canonical = builtinVariables.get(text.slice(start, end).toLowerCase());
		result += canonical === undefined ? text.slice(i, end) : `$${canonical}`;
		i = end;
	}

	return result;
}

export function normalizeArg(
	arg: string,
	instrParams: ReadonlyMap<string, string> | undefined,
	singleQuote: boolean,
): string {
	if (arg.startsWith('$')) {
		return normalizeVariables(arg);
	}
	if (arg.startsWith('"') || arg.startsWith("'") || arg.startsWith('`')) {
		return normalizeVariables(normalizeQuotes(arg, singleQuote));
	}

	const lower = arg.toLowerCase();

	const exact = instrParams?.get(lower) ?? globalParameters.get(lower);
	if (exact !== undefined) return exact;

	const eqIdx = arg.indexOf('=');
	if (eqIdx > 0) {
		const prefixLower = `${lower.slice(0, eqIdx + 1)}`;
		const canonical = globalParameterPrefixes.get(prefixLower);
		if (canonical !== undefined) {
			return `${canonical}${normalizeVariables(arg.slice(eqIdx + 1))}`;
		}
	}

	return normalizeVariables(arg);
}

export function splitPipeTokens(args: string[]): string[] {
	return args.flatMap((arg) => {
		if (arg.startsWith('"') || arg.startsWith("'") || arg.startsWith('`')) {
			return [arg];
		}
		if (!arg.includes('|') || arg === '|') {
			return [arg];
		}
		return splitPreservingGroups(arg, '|');
	});
}

export function splitArithmeticTokens(args: string[]): string[] {
	return args.flatMap((arg) => {
		if (arg.startsWith('"') || arg.startsWith("'") || arg.startsWith('`')) {
			return [arg];
		}
		if (ARITHMETIC_OPS.has(arg)) {
			return [arg];
		}
		return tokenizeArithmetic(arg);
	});
}

export function joinWithCompactPipes(args: string[]): string {
	let result = '';
	for (let i = 0; i < args.length; i++) {
		const arg = args[i] as string;
		if (arg === '|') {
			result += '|';
		} else if (i > 0 && args[i - 1] === '|') {
			result += arg;
		} else {
			if (result) result += ' ';
			result += arg;
		}
	}
	return result;
}

function stripQuoteDelimiters(arg: string): [string, string] | undefined {
	const delim = arg[0];
	if (delim === '"' || delim === "'" || delim === '`') {
		return [delim, arg.slice(1, -1)];
	}
	return undefined;
}

function unescapeInner(inner: string): string {
	// NSIS has no doubled-delimiter escape: makensis reads `"a""b"` as two separate
	// tokens, so `""` is only ever two literal characters.
	return inner.replaceAll('$\\"', '"').replaceAll("$\\'", "'").replaceAll('$\\`', '`');
}

function escapeForDouble(inner: string): string {
	return inner.replaceAll('"', '$\\"');
}

function splitPreservingGroups(arg: string, sep: string): string[] {
	const result: string[] = [];
	let current = '';
	let i = 0;

	while (i < arg.length) {
		if (arg[i] === '$' && arg[i + 1] === '{') {
			const end = arg.indexOf('}', i + 2);
			if (end !== -1) {
				current += arg.slice(i, end + 1);
				i = end + 1;
				continue;
			}
		}

		if (arg[i] === sep) {
			if (current) result.push(current);
			current = '';
			result.push(sep);
			i++;
			continue;
		}

		current += arg[i];
		i++;
	}

	if (current) result.push(current);
	return result;
}

const ARITHMETIC_OPS = new Set(['>>>', '||', '&&', '<<', '>>', '+', '-', '*', '/', '%', '|', '&', '^', '~', '!']);
const SINGLE_CHAR_OPS = new Set(['+', '-', '*', '/', '%', '|', '&', '^', '~', '!']);

function tokenizeArithmetic(arg: string): string[] {
	const result: string[] = [];
	let current = '';
	let lastWasOp = true;
	let i = 0;

	while (i < arg.length) {
		if (arg[i] === '$' && arg[i + 1] === '{') {
			const end = arg.indexOf('}', i + 2);
			if (end !== -1) {
				current += arg.slice(i, end + 1);
				i = end + 1;
				lastWasOp = false;
				continue;
			}
		}

		if (i + 2 < arg.length) {
			const three = arg.slice(i, i + 3);
			if (ARITHMETIC_OPS.has(three)) {
				if (current) {
					result.push(current);
					current = '';
				}
				result.push(three);
				lastWasOp = true;
				i += 3;
				continue;
			}
		}

		if (i + 1 < arg.length) {
			const two = arg.slice(i, i + 2);
			if (ARITHMETIC_OPS.has(two)) {
				if (current) {
					result.push(current);
					current = '';
				}
				result.push(two);
				lastWasOp = true;
				i += 2;
				continue;
			}
		}

		const ch = arg[i] as string;
		if (SINGLE_CHAR_OPS.has(ch)) {
			if (ch === '-' && lastWasOp) {
				current += ch;
				i++;
				continue;
			}
			if (current) {
				result.push(current);
				current = '';
			}
			result.push(ch);
			lastWasOp = true;
			i++;
			continue;
		}

		current += ch;
		lastWasOp = false;
		i++;
	}

	if (current) result.push(current);
	return result.length > 0 ? result : [arg];
}
