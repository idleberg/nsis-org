// nsis scripts, after the textmate grammar in idleberg/nsis-org
//
// the grammar only recognises structure, every word leaves it as identifier
// and the reclassifier promotes instructions, constants and include macros
// case-insensitively, as makensis reads them
//
// gap is the start of a token, word the middle of one. quotes, comments,
// numbers, /OPTIONS and !directives only count in gap, so can't and
// foo#bar stay text as they do for makensis
//
// known limitations
// a comment ending in a backslash does not continue onto the next line
// strings span lines, as in the textmate grammar
// of the IntOp operators only + - and / are marked

import type { GrammarRule, GrammarState } from '@twinkleplop/core';
import { ALNUM, DIGIT, enter, fallback, goto, LETTER, leave, match, on, within } from '@twinkleplop/core';
import { define_grammar } from '@twinkleplop/core/compile';
import * as TOKENS from '@twinkleplop/core/tokens';

// probes take literal characters only
const LETTERS = [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const DIGITS = [...'0123456789'];
const WS = [' ', '\t', '\f', '\v'];
const EOL = ['\n', '\r'];
const COMPARISON = ['!=', '<>', '<=', '>=', '==', '=', '<', '>'];
const NAME_CHARS = [ALNUM, '_', '.'];
const DEFINE_CHARS = [ALNUM, '_', '.', '-', '!', ':', '^'];

const states: Record<string, GrammarState> = {};

// variables, defines, language strings and escapes, with one copy of their
// states per way out, back to word outside strings and leave() inside them
const dollar = (suffix: string, into: (state: string) => GrammarRule, exit: GrammarRule): GrammarRule[] => {
	states[`var${suffix}`] = { rules: [match(NAME_CHARS, TOKENS.variable), fallback(exit)] };
	states[`define${suffix}`] = {
		rules: [match('}', TOKENS.constant, exit), match(DEFINE_CHARS, TOKENS.constant), fallback(exit)],
	};
	states[`langstring${suffix}`] = {
		rules: [match(')', TOKENS.constant, exit), match(DEFINE_CHARS, TOKENS.constant), fallback(exit)],
	};
	states[`escape${suffix}`] = {
		rules: [fallback({ token: TOKENS.string_escape, ...exit })],
	};

	return [
		{ ...match(['$$'], TOKENS.string_escape), seal: true },
		{ ...match('$\\', TOKENS.string_escape, into(`escape${suffix}`)), seal: true },
		{ ...match('${', TOKENS.constant, into(`define${suffix}`)), seal: true },
		{ ...match('$(', TOKENS.constant, into(`langstring${suffix}`)), seal: true },
		{ ...match('$', TOKENS.variable, into(`var${suffix}`)), seal: true },
	];
};

// inside a string the dollar states sit on top of it and pop back
const dollar_in_string = dollar('_string', enter, leave());

const string_state = (quote: string): GrammarState => ({
	rules: [match(quote, TOKENS.string, leave()), ...dollar_in_string, fallback({ token: TOKENS.string })],
});

// rules shared by both positions in a token
const inline: GrammarRule[] = [
	...dollar('', goto, goto('word')),
	// a backslash before the line ending continues the line
	match(['\\\n', '\\\r\n'], TOKENS.punctuation, goto('gap')),
	match(COMPARISON, TOKENS.operator, goto('gap')),
	match(['_', '.', LETTER], TOKENS.identifier, goto('name')),
];

export default define_grammar({
	name: 'nsis',
	states: {
		// gap must stay first, it is the entry state
		gap: {
			rules: [
				on([...WS, ...EOL]),
				match([';', '#'], TOKENS.comment, goto('comment')),
				within('/*', '*/', TOKENS.comment),
				on('/', enter('slash_probe')),
				on(['+', '-'], enter('sign_probe')),
				match('"', TOKENS.string, enter('string_dq')),
				match("'", TOKENS.string, enter('string_sq')),
				match('`', TOKENS.string, enter('string_bt')),
				...inline,
				match('!', TOKENS.keyword, goto('directive')),
				match(DIGIT, TOKENS.number, goto('number')),
				fallback(goto('word')),
			],
		},

		word: {
			rules: [on([...WS, ...EOL], goto('gap')), ...inline, fallback()],
		},

		comment: {
			rules: [on(EOL, goto('gap')), fallback({ token: TOKENS.comment })],
		},

		// colons stay in the word so plugin calls like nsDialogs::Create hold
		// together and a label keeps its colon
		name: {
			rules: [match([...NAME_CHARS, '-', ':'], TOKENS.identifier), fallback(goto('word'))],
		},

		number: {
			rules: [match(NAME_CHARS, TOKENS.number), fallback(goto('word'))],
		},

		directive: {
			rules: [match(LETTER, TOKENS.keyword), fallback(goto('word'))],
		},

		// /OPTION before a letter, a bare slash is IntOp division
		slash_probe: {
			mode: 'probe',
			fallback: 'slash',
			rules: [on(LETTERS, enter('option')), fallback(enter('slash'))],
		},

		option: {
			rules: [
				match('/', TOKENS.parameter),
				match('=', TOKENS.parameter, leave()),
				match([ALNUM, '_'], TOKENS.parameter),
				fallback(leave()),
			],
		},

		slash: {
			rules: [match('/', TOKENS.operator, leave())],
		},

		// a sign before a digit is a relative jump like +2, otherwise IntOp
		sign_probe: {
			mode: 'probe',
			fallback: 'sign',
			rules: [on(DIGITS, enter('signed')), fallback(enter('sign'))],
		},

		signed: {
			rules: [match(['+', '-'], TOKENS.number, leave())],
		},

		sign: {
			rules: [match(['+', '-'], TOKENS.operator, leave())],
		},

		string_dq: string_state('"'),
		string_sq: string_state("'"),
		string_bt: string_state('`'),

		...states,
	},
});
