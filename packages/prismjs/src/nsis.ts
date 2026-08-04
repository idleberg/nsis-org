/*! @nsis/prismjs | MIT License | github.com/idleberg/nsis-org */

import { importantPattern, keywordPattern, propertyPattern } from './macros.ts' with { type: 'macro' };

declare const Prism: {
	languages: Record<string, unknown>;
};

Prism.languages.nsis = {
	comment: {
		pattern: /(^|[^\\])(\/\*[\s\S]*?\*\/|[#;].*)/,
		lookbehind: true,
		greedy: true,
	},
	string: {
		pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
		greedy: true,
	},
	keyword: {
		pattern: keywordPattern(),
		lookbehind: true,
	},
	property: propertyPattern(),
	constant: /\${[\w.:^-]+}|\$\([\w.:^-]+\)/i,
	variable: /\$\w+/i,
	number: /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+(?:[Ee]-?\d+)?)\b/,
	operator: /--?|\+\+?|<=?|>=?|==?=?|&&?|\|\|?|[?*/~^%]/,
	punctuation: /[{}[\];(),.:]/,
	important: {
		pattern: importantPattern(),
		lookbehind: true,
	},
};
