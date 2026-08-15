/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: NSIS definitions */
import { expect, test } from 'vitest';
import {
	joinInstructionArgs,
	joinWithCompactPipes,
	normalizeArg,
	normalizeInstructionArgs,
	normalizeQuotes,
	normalizeVariables,
	splitArithmeticTokens,
	splitPipeTokens,
} from './normalize.ts';

// --- normalizeQuotes ---

test('normalizeQuotes: double to double (no-op)', () => {
	expect(normalizeQuotes('"hello"', false)).toBe('"hello"');
});

test('normalizeQuotes: single to double', () => {
	expect(normalizeQuotes("'hello'", false)).toBe('"hello"');
});

test('normalizeQuotes: double to single', () => {
	expect(normalizeQuotes('"hello"', true)).toBe("'hello'");
});

test('normalizeQuotes: backtick to double', () => {
	expect(normalizeQuotes('`hello`', false)).toBe('"hello"');
});

test('normalizeQuotes: prefers target when content is clean', () => {
	expect(normalizeQuotes("'no special'", false)).toBe('"no special"');
});

test('normalizeQuotes: falls back to alt when target char is in content', () => {
	expect(normalizeQuotes('`she said "hi"`', false)).toBe('\'she said "hi"\'');
});

test('normalizeQuotes: falls back to backtick when both quote types present', () => {
	expect(normalizeQuotes(`"it's a "test""`, false)).toBe('`it\'s a "test"`');
});

test('normalizeQuotes: escapes for double when all quote types present', () => {
	const input = '`it\'s "a" `test``';
	const result = normalizeQuotes(input, false);
	expect(result[0]).toBe('"');
	expect(result[result.length - 1]).toBe('"');
});

test('normalizeQuotes: unescapes $\\" before re-quoting', () => {
	expect(normalizeQuotes('"say $\\"hi$\\""', true)).toBe('\'say "hi"\'');
});

test('normalizeQuotes: "" is not an escape', () => {
	// makensis reads `"a""b"` as two tokens, so `""` is never an escape for `"`.
	// Inside a single-quoted string it is simply two literal characters.
	expect(normalizeQuotes('\'a ""b"" c\'', false)).toBe('\'a ""b"" c\'');
	expect(normalizeQuotes('`a ""b"" c`', false)).toBe('\'a ""b"" c\'');
});

test('normalizeQuotes: returns bare tokens unchanged', () => {
	expect(normalizeQuotes('MB_OK', false)).toBe('MB_OK');
});

// --- normalizeArg ---

test('normalizeArg: $-prefixed args are untouched', () => {
	expect(normalizeArg('$INSTDIR', undefined, false)).toBe('$INSTDIR');
});

test('normalizeArg: quoted args go through normalizeQuotes', () => {
	expect(normalizeArg("'hello'", undefined, false)).toBe('"hello"');
});

test('normalizeArg: global parameter is canonicalised', () => {
	expect(normalizeArg('/silent', undefined, false)).toBe('/SILENT');
});

test('normalizeArg: instruction-specific parameter takes precedence', () => {
	const instrParams = new Map([['true', 'true']]);
	expect(normalizeArg('TRUE', instrParams, false)).toBe('true');
});

test('normalizeArg: parameterised prefix is canonicalised', () => {
	expect(normalizeArg('/lang=1033', undefined, false)).toBe('/LANG=1033');
});

test('normalizeArg: unknown bare token is returned as-is', () => {
	expect(normalizeArg('SomeCustomThing', undefined, false)).toBe('SomeCustomThing');
});

// --- splitPipeTokens ---

test('splitPipeTokens: splits MB_OK|MB_DEFBUTTON1', () => {
	expect(splitPipeTokens(['MB_OK|MB_DEFBUTTON1'])).toEqual(['MB_OK', '|', 'MB_DEFBUTTON1']);
});

test('splitPipeTokens: leading pipe', () => {
	expect(splitPipeTokens(['|MB_DEFBUTTON1'])).toEqual(['|', 'MB_DEFBUTTON1']);
});

test('splitPipeTokens: trailing pipe', () => {
	expect(splitPipeTokens(['MB_OK|'])).toEqual(['MB_OK', '|']);
});

test('splitPipeTokens: standalone pipe passes through', () => {
	expect(splitPipeTokens(['|'])).toEqual(['|']);
});

test('splitPipeTokens: no pipe passes through', () => {
	expect(splitPipeTokens(['MB_OK', '"hello"'])).toEqual(['MB_OK', '"hello"']);
});

test('splitPipeTokens: quoted strings are never split', () => {
	expect(splitPipeTokens(['"a|b"'])).toEqual(['"a|b"']);
});

test('splitPipeTokens: preserves ${...} groups across pipe', () => {
	expect(splitPipeTokens(['${MB_OK}|${MB_DEFBUTTON1}'])).toEqual(['${MB_OK}', '|', '${MB_DEFBUTTON1}']);
});

test('splitPipeTokens: $variable|$variable', () => {
	expect(splitPipeTokens(['$1|$2'])).toEqual(['$1', '|', '$2']);
});

// --- splitArithmeticTokens ---

test('splitArithmeticTokens: $1+$2', () => {
	expect(splitArithmeticTokens(['$1+$2'])).toEqual(['$1', '+', '$2']);
});

test('splitArithmeticTokens: $1-$2 (binary minus)', () => {
	expect(splitArithmeticTokens(['$1-$2'])).toEqual(['$1', '-', '$2']);
});

test('splitArithmeticTokens: $1+-$2 (unary minus after operator)', () => {
	expect(splitArithmeticTokens(['$1+-$2'])).toEqual(['$1', '+', '-$2']);
});

test('splitArithmeticTokens: leading unary minus', () => {
	expect(splitArithmeticTokens(['-$1'])).toEqual(['-$1']);
});

test('splitArithmeticTokens: multi-char operator ||', () => {
	expect(splitArithmeticTokens(['$1||$2'])).toEqual(['$1', '||', '$2']);
});

test('splitArithmeticTokens: multi-char operator <<', () => {
	expect(splitArithmeticTokens(['$1<<$2'])).toEqual(['$1', '<<', '$2']);
});

test('splitArithmeticTokens: three-char operator >>>', () => {
	expect(splitArithmeticTokens(['$1>>>$2'])).toEqual(['$1', '>>>', '$2']);
});

test('splitArithmeticTokens: standalone operator passes through', () => {
	expect(splitArithmeticTokens(['+'])).toEqual(['+']);
});

test('splitArithmeticTokens: quoted strings are never split', () => {
	expect(splitArithmeticTokens(['"1+2"'])).toEqual(['"1+2"']);
});

test('splitArithmeticTokens: preserves ${...} groups', () => {
	expect(splitArithmeticTokens(['${a}+${b}'])).toEqual(['${a}', '+', '${b}']);
});

// --- joinWithCompactPipes ---

test('joinWithCompactPipes: basic pipe join', () => {
	expect(joinWithCompactPipes(['MB_OK', '|', 'MB_DEFBUTTON1'])).toBe('MB_OK|MB_DEFBUTTON1');
});

test('joinWithCompactPipes: pipe with trailing arg', () => {
	expect(joinWithCompactPipes(['MB_OK', '|', 'MB_DEFBUTTON1', '"Hello"'])).toBe('MB_OK|MB_DEFBUTTON1 "Hello"');
});

test('joinWithCompactPipes: no pipes', () => {
	expect(joinWithCompactPipes(['"hello"', '$INSTDIR'])).toBe('"hello" $INSTDIR');
});

test('joinWithCompactPipes: leading pipe', () => {
	expect(joinWithCompactPipes(['|', 'MB_OK'])).toBe('|MB_OK');
});

// --- joinInstructionArgs ---

test('joinInstructionArgs: uses compact pipes for regular instructions', () => {
	expect(joinInstructionArgs(['MB_OK', '|', 'MB_DEFBUTTON1'], 'MessageBox')).toBe('MB_OK|MB_DEFBUTTON1');
});

test('joinInstructionArgs: uses spaces for IntOp', () => {
	expect(joinInstructionArgs(['$1', '+', '$2'], 'IntOp')).toBe('$1 + $2');
});

test('joinInstructionArgs: uses spaces for IntPtrOp', () => {
	expect(joinInstructionArgs(['$1', '-', '$2'], 'IntPtrOp')).toBe('$1 - $2');
});

// --- normalizeInstructionArgs (integration) ---

test('normalizeInstructionArgs: splits pipes and normalises args', () => {
	const result = normalizeInstructionArgs(['MB_OK|MB_DEFBUTTON1', '/silent'], 'MessageBox', false);
	expect(result).toEqual(['MB_OK', '|', 'MB_DEFBUTTON1', '/SILENT']);
});

test('normalizeInstructionArgs: splits arithmetic for IntOp', () => {
	const result = normalizeInstructionArgs(['$1+$2'], 'IntOp', false);
	expect(result).toEqual(['$1', '+', '$2']);
});

test('normalizeInstructionArgs: normalises quotes', () => {
	const result = normalizeInstructionArgs(["'hello'"], 'Name', false);
	expect(result).toEqual(['"hello"']);
});

test('normalizeInstructionArgs: preserves $-prefixed args', () => {
	const result = normalizeInstructionArgs(['$INSTDIR'], 'SetOutPath', false);
	expect(result).toEqual(['$INSTDIR']);
});

// --- normalizeVariables ---

test('normalizeVariables: built-in named variables', () => {
	expect(normalizeVariables('$instdir')).toBe('$INSTDIR');
	expect(normalizeVariables('$Temp')).toBe('$TEMP');
	expect(normalizeVariables('$hwndParent')).toBe('$HWNDPARENT');
	expect(normalizeVariables('$_click')).toBe('$_CLICK');
});

test('normalizeVariables: registers', () => {
	expect(normalizeVariables('$r0')).toBe('$R0');
	expect(normalizeVariables('$R9')).toBe('$R9');
	expect(normalizeVariables('$0')).toBe('$0');
});

test('normalizeVariables: custom variables are left alone', () => {
	expect(normalizeVariables('$myVar')).toBe('$myVar');
	expect(normalizeVariables('$instdirfoo')).toBe('$instdirfoo');
});

test('normalizeVariables: built-in defines', () => {
	expect(normalizeVariables('${nsisdir}')).toBe('${NSISDIR}');
	expect(normalizeVariables('${__file__}')).toBe('${__FILE__}');
	expect(normalizeVariables('${nsis_char_size}')).toBe('${NSIS_CHAR_SIZE}');
});

test('normalizeVariables: custom defines are left alone', () => {
	expect(normalizeVariables('${myDefine}')).toBe('${myDefine}');
	expect(normalizeVariables('${U+00e9}')).toBe('${U+00e9}');
});

test('normalizeVariables: include macros in argument position', () => {
	expect(normalizeVariables('${getsize}')).toBe('${GetSize}');
});

test('normalizeVariables: built-in language strings', () => {
	expect(normalizeVariables('$(^name)')).toBe('$(^Name)');
	expect(normalizeVariables('$(^NAMEDA)')).toBe('$(^NameDA)');
	expect(normalizeVariables('$(MyLangString)')).toBe('$(MyLangString)');
});

test('normalizeVariables: environment variables are left alone', () => {
	expect(normalizeVariables('$%windir%')).toBe('$%windir%');
	expect(normalizeVariables('$%Path%\\bin')).toBe('$%Path%\\bin');
});

test('normalizeVariables: escapes are preserved', () => {
	expect(normalizeVariables('$$instdir')).toBe('$$instdir');
	expect(normalizeVariables('a$\\nb')).toBe('a$\\nb');
	expect(normalizeVariables('$\\"$instdir$\\"')).toBe('$\\"$INSTDIR$\\"');
});

test('normalizeVariables: concatenated references', () => {
	expect(normalizeVariables('$instdir$temp${nsisdir}')).toBe('$INSTDIR$TEMP${NSISDIR}');
});

test('normalizeVariables: path segments', () => {
	expect(normalizeVariables('$instdir\\Uninstall.exe')).toBe('$INSTDIR\\Uninstall.exe');
});

test('normalizeVariables: unterminated groups', () => {
	expect(normalizeVariables('${nsisdir')).toBe('${nsisdir');
	expect(normalizeVariables('$(^name')).toBe('$(^name');
	expect(normalizeVariables('$')).toBe('$');
});

test('normalizeArg: normalises variables inside quotes', () => {
	expect(normalizeArg('"$instdir\\foo.exe"', undefined, false)).toBe('"$INSTDIR\\foo.exe"');
});

test('normalizeInstructionArgs: normalises $-prefixed args', () => {
	expect(normalizeInstructionArgs(['$instdir'], 'SetOutPath', false)).toEqual(['$INSTDIR']);
	expect(normalizeInstructionArgs(['$r0', '$r0', '+', '1'], 'IntOp', false)).toEqual(['$R0', '$R0', '+', '1']);
});
