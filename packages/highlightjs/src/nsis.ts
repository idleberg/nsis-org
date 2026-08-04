/*
 * Language: NSIS
 * Description: Nullsoft Scriptable Install System
 * Author: Jan T. Sott
 * Website: https://nsis.sourceforge.io/Main_Page
 * Category: scripting
 */
import type { HLJSApi } from 'highlight.js';
import { blockKeywords, compilerFlags, keywords, literals, parameterNames } from './macros.ts' with { type: 'macro' };

export default function (hljs: HLJSApi) {
	const regex = hljs.regex;
	const LANGUAGE_CONSTANTS = [
		'ADMINTOOLS',
		'APPDATA',
		'CDBURN_AREA',
		'CMDLINE',
		'COMMONFILES32',
		'COMMONFILES64',
		'COMMONFILES',
		'COOKIES',
		'DESKTOP',
		'DOCUMENTS',
		'EXEDIR',
		'EXEFILE',
		'EXEPATH',
		'FAVORITES',
		'FONTS',
		'HISTORY',
		'HWNDPARENT',
		'INSTDIR',
		'INTERNET_CACHE',
		'LANGUAGE',
		'LOCALAPPDATA',
		'MUSIC',
		'NETHOOD',
		'NSIS_MAX_STRLEN',
		'NSIS_VERSION',
		'NSISDIR',
		'OUTDIR',
		'PICTURES',
		'PLUGINSDIR',
		'PRINTHOOD',
		'PROFILE',
		'PROGRAMFILES32',
		'PROGRAMFILES64',
		'PROGRAMFILES',
		'QUICKLAUNCH',
		'RECENT',
		'RESOURCES_LOCALIZED',
		'RESOURCES',
		'SENDTO',
		'SMPROGRAMS',
		'SMSTARTUP',
		'STARTMENU',
		'SYSDIR',
		'TEMP',
		'TEMPLATES',
		'VIDEOS',
		'WINDIR',
	];

	const CONSTANTS = {
		className: 'variable.constant',
		begin: regex.concat(/\$/, regex.either(...LANGUAGE_CONSTANTS)),
	};

	const DEFINES = {
		// ${defines}
		className: 'variable',
		begin: /\$+\{[!\w.:-]+\}/,
	};

	const VARIABLES = {
		// $variables
		className: 'variable',
		begin: /\$+\w[\w.]*/,
		illegal: /\(\)\{\}/,
	};

	const LANGUAGES = {
		// $(language_strings)
		className: 'variable',
		begin: /\$+\([\w^.:!-]+\)/,
	};

	const PARAMETERS = {
		// command parameters
		className: 'params',
		begin: regex.concat(regex.either(...parameterNames()), /\b/),
	};

	const COMPILER = {
		// !compiler_flags
		className: 'keyword',
		begin: regex.concat(/!/, regex.either(...compilerFlags()), /\b/),
	};

	const ESCAPE_CHARS = {
		// $\n, $\r, $\t, $$
		className: 'char.escape',
		begin: /\$(\\[nrt]|\$)/,
	};

	const PLUGINS = {
		// plug::ins
		className: 'title.function',
		begin: /\w+::\w+/,
	};

	const STRING = {
		className: 'string',
		variants: [
			{
				begin: '"',
				end: '"',
			},
			{
				begin: "'",
				end: "'",
			},
			{
				begin: '`',
				end: '`',
			},
		],
		illegal: /\n/,
		contains: [ESCAPE_CHARS, CONSTANTS, DEFINES, VARIABLES, LANGUAGES],
	};

	const FUNCTION_DEFINITION = {
		match: [/Function/, /\s+/, regex.concat(/(\.)?/, hljs.IDENT_RE)],
		scope: {
			1: 'keyword',
			3: 'title.function',
		},
	};

	// Var Custom.Variable.Name.Item
	// Var /GLOBAL Custom.Variable.Name.Item
	const VARIABLE_NAME_RE = /[A-Za-z][\w.]*/;
	const VARIABLE_DEFINITION = {
		match: [/Var/, /\s+/, /(?:\/GLOBAL\s+)?/, VARIABLE_NAME_RE],
		scope: {
			1: 'keyword',
			3: 'params',
			4: 'variable',
		},
	};

	return {
		name: 'NSIS',
		case_insensitive: true,
		keywords: {
			keyword: keywords(),
			literal: literals(),
		},
		contains: [
			hljs.HASH_COMMENT_MODE,
			hljs.C_BLOCK_COMMENT_MODE,
			hljs.COMMENT(';', '$', { relevance: 0 }),
			VARIABLE_DEFINITION,
			FUNCTION_DEFINITION,
			{ beginKeywords: blockKeywords() },
			STRING,
			COMPILER,
			DEFINES,
			VARIABLES,
			LANGUAGES,
			PARAMETERS,
			PLUGINS,
			hljs.C_NUMBER_MODE,
		],
	};
}
