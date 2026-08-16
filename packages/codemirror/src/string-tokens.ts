import { ExternalTokenizer } from '@lezer/lr';
import {
	BTDefineRef,
	BTEscape,
	BTLangRef,
	BTVariable,
	btContent,
	DQDefineRef,
	DQEscape,
	DQLangRef,
	DQVariable,
	dqContent,
	SQDefineRef,
	SQEscape,
	SQLangRef,
	SQVariable,
	sqContent,
} from './parser.terms.js';

function makeTokenizer(
	endChar: number,
	content: number,
	escapeToken: number,
	variable: number,
	defineRef: number,
	langRef: number,
) {
	return new ExternalTokenizer((input) => {
		const ch = input.next;

		// NSIS strings never span a raw newline, so stopping here keeps a stray quote from
		// pairing up with one on a later line and corrupting the rest of the document.
		if (ch < 0 || ch === endChar || ch === 10 /* \n */) return;

		// Line continuation
		if (ch === 92 /* \ */ && input.peek(1) === 10 /* \n */) {
			input.advance(2);
			input.acceptToken(content);
			return;
		}

		if (ch === 36 /* $ */) {
			const next = input.peek(1);

			// $\x escape
			if (next === 92 /* \ */) {
				const third = input.peek(2);
				if (third >= 0) {
					input.advance(3);
					input.acceptToken(escapeToken);
					return;
				}
			}

			// $$ escape
			if (next === 36 /* $ */) {
				input.advance(2);
				input.acceptToken(escapeToken);
				return;
			}

			// ${...} define reference
			if (next === 123 /* { */) {
				input.advance(2);
				while (input.next >= 0 && input.next !== 125 /* } */) input.advance();
				if (input.next === 125) input.advance();
				input.acceptToken(defineRef);
				return;
			}

			// $(...) lang string reference
			if (next === 40 /* ( */) {
				input.advance(2);
				while (input.next >= 0 && input.next !== 41 /* ) */) input.advance();
				if (input.next === 41) input.advance();
				input.acceptToken(langRef);
				return;
			}

			// $letter... variable
			if ((next >= 65 && next <= 90) || (next >= 97 && next <= 122) || next === 95) {
				input.advance(2);
				while (true) {
					const c = input.next;
					if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 95) input.advance();
					else break;
				}
				input.acceptToken(variable);
				return;
			}

			// $digit variable
			if (next >= 48 && next <= 57) {
				input.advance(2);
				input.acceptToken(variable);
				return;
			}
		}

		// Plain content: consume until end delimiter, $, newline, line continuation or EOF
		do {
			input.advance();
		} while (
			input.next >= 0 &&
			input.next !== endChar &&
			input.next !== 36 /* $ */ &&
			input.next !== 10 /* \n */ &&
			!(input.next === 92 /* \ */ && input.peek(1) === 10)
		);
		input.acceptToken(content);
	});
}

export const dqTokenizer = makeTokenizer(34 /* " */, dqContent, DQEscape, DQVariable, DQDefineRef, DQLangRef);
export const sqTokenizer = makeTokenizer(39 /* ' */, sqContent, SQEscape, SQVariable, SQDefineRef, SQLangRef);
export const btTokenizer = makeTokenizer(96 /* ` */, btContent, BTEscape, BTVariable, BTDefineRef, BTLangRef);
