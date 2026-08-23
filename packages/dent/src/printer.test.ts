/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: NSIS definitions */
import { expect, test } from 'vitest';
import { createFormatter } from './dent.ts';

// --- Canonical casing ---

test('Lowercased instruction is normalised to canonical casing', () => {
	const { format } = createFormatter();
	const result = format('name "demo"\n');
	expect(result).toBe('Name "demo"\n');
});

test('Uppercased instruction is normalised to canonical casing', () => {
	const { format } = createFormatter();
	const result = format('OUTFILE "demo.exe"\n');
	expect(result).toBe('OutFile "demo.exe"\n');
});

test('Mixed-case instruction is normalised to canonical casing', () => {
	const { format } = createFormatter();
	const result = format('SetOUTPATH "$INSTDIR"\n');
	expect(result).toBe('SetOutPath "$INSTDIR"\n');
});

test('Compiler command casing is normalised to lowercase', () => {
	const { format } = createFormatter();
	const result = format('!INCLUDE "LogicLib.nsh"\n');
	expect(result).toBe('!include "LogicLib.nsh"\n');
});

test('Block keyword casing is normalised', () => {
	const { format } = createFormatter();
	const result = format('FUNCTION .onInit\nNop\nFUNCTIONEND\n');
	expect(result).toBe('Function .onInit\n\tNop\nFunctionEnd\n');
});

test('Section keyword casing is normalised', () => {
	const { format } = createFormatter();
	const result = format('SECTION "test"\nNop\nSECTIONEND\n');
	expect(result).toBe('Section "test"\n\tNop\nSectionEnd\n');
});

test('Plugin call casing is preserved (not in canonical map)', () => {
	const { format } = createFormatter();
	const result = format('nsDialogs::Create /NOUNLOAD 1018\n');
	expect(result).toBe('nsDialogs::Create /nounload 1018\n');
});

// --- Include macro casing ---

test('LogicLib macro casing is normalised', () => {
	const { format } = createFormatter();
	const result = format('${if} $R0 == ""\n${endif}\n');
	expect(result).toBe('${If} $R0 == ""\n${EndIf}\n');
});

test('LogicLib loop macro casing is normalised', () => {
	const { format } = createFormatter();
	const result = format('${while} $0 < 3\n${endwhile}\n${for} $0 1 3\n${next}\n');
	expect(result).toBe('${While} $0 < 3\n${EndWhile}\n\n${For} $0 1 3\n${Next}\n');
});

test('LogicLib inverse conditional casing is normalised', () => {
	const { format } = createFormatter();
	const result = format('${unless} $R0 == ""\n${endunless}\n');
	expect(result).toBe('${Unless} $R0 == ""\n${EndUnless}\n');
});

test('FileFunc macro casing is normalised', () => {
	const { format } = createFormatter();
	const result = format('${GETSIZE} "$INSTDIR" "/S=0K" $0 $1 $2\n');
	expect(result).toBe('${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2\n');
});

test('WinVer macro with dot in name is normalised', () => {
	const { format } = createFormatter();
	const result = format('${atleastwin8.1} $0\n');
	expect(result).toBe('${AtLeastWin8.1} $0\n');
});

test('x64 macro casing is normalised', () => {
	const { format } = createFormatter();
	const result = format('${runningx64} $0\n');
	expect(result).toBe('${RunningX64} $0\n');
});

test('Unknown macro keyword is not modified', () => {
	const { format } = createFormatter();
	const result = format('${MyCustomMacro} "arg"\n');
	expect(result).toBe('${MyCustomMacro} "arg"\n');
});

// --- Whitespace normalisation ---

test('Multiple spaces between tokens are collapsed to one', () => {
	const { format } = createFormatter();
	const result = format('MessageBox    MB_OK    "Hello"\n');
	expect(result).toBe('MessageBox MB_OK "Hello"\n');
});

test('Leading whitespace is removed', () => {
	const { format } = createFormatter();
	const result = format('    Name "demo"\n');
	expect(result).toBe('Name "demo"\n');
});

test('Trailing whitespace is removed', () => {
	const { format } = createFormatter();
	const result = format('Name "demo"   \n');
	expect(result).toBe('Name "demo"\n');
});

// --- Blank line collapsing ---

test('Multiple consecutive blank lines collapsed to one (trimEmptyLines: true)', () => {
	const { format } = createFormatter({ trimEmptyLines: true });
	const result = format('Name "a"\n\n\n\nOutFile "b"\n');
	expect(result).toBe('Name "a"\n\nOutFile "b"\n');
});

test('Leading blank lines are stripped (trimEmptyLines: true)', () => {
	const { format } = createFormatter({ trimEmptyLines: true });
	const result = format('\n\nName "demo"\n');
	expect(result).toBe('Name "demo"\n');
});

test('Trailing blank lines are stripped (trimEmptyLines: true)', () => {
	const { format } = createFormatter({ trimEmptyLines: true });
	const result = format('Name "demo"\n\n\n');
	expect(result).toBe('Name "demo"\n');
});

test('Blank lines preserved when trimEmptyLines is false', () => {
	const { format } = createFormatter({ trimEmptyLines: false });
	const result = format('Name "a"\n\n\n\nOutFile "b"\n');
	expect(result).toBe('Name "a"\n\n\n\nOutFile "b"\n');
});

// --- Trailing comments ---

test('Instruction trailing comment is preserved in output', () => {
	const { format } = createFormatter();
	const result = format('Nop ; do nothing\n');
	expect(result).toBe('Nop ; do nothing\n');
});

test('Instruction trailing hash comment is preserved in output', () => {
	const { format } = createFormatter();
	const result = format('Nop # do nothing\n');
	expect(result).toBe('Nop # do nothing\n');
});

// --- Labels ---

test('Labels are printed with colon', () => {
	const { format } = createFormatter();
	const result = format('Function .onInit\nmyLabel:\nNop\nFunctionEnd\n');
	expect(result).toBe('Function .onInit\n\tmyLabel:\n\tNop\nFunctionEnd\n');
});

test('Label with trailing comment', () => {
	const { format } = createFormatter();
	const result = format('Function .onInit\ndone: ; end\nFunctionEnd\n');
	expect(result).toBe('Function .onInit\n\tdone: ; end\nFunctionEnd\n');
});

// --- Indentation styles ---

test('Space indentation with custom size', () => {
	const { format } = createFormatter({ useTabs: false, indentSize: 4 });
	const result = format('Function .onInit\nNop\nFunctionEnd\n');
	expect(result).toBe('Function .onInit\n    Nop\nFunctionEnd\n');
});

// --- Parameter casing ---

test('Slash flag is normalised to uppercase', () => {
	const { format } = createFormatter();
	const result = format('CopyFiles /silent "src" "dst"\n');
	expect(result).toBe('CopyFiles /SILENT "src" "dst"\n');
});

test('Slash flag already uppercase is preserved', () => {
	const { format } = createFormatter();
	const result = format('Delete /REBOOTOK "file.exe"\n');
	expect(result).toBe('Delete /REBOOTOK "file.exe"\n');
});

test('Lowercase slash flag stays lowercase', () => {
	const { format } = createFormatter();
	const result = format('File /R "data"\n');
	expect(result).toBe('File /r "data"\n');
});

test('Registry root key is normalised to uppercase', () => {
	const { format } = createFormatter();
	const result = format('DeleteRegKey hklm "Software\\Demo"\n');
	expect(result).toBe('DeleteRegKey HKLM "Software\\Demo"\n');
});

test('MessageBox flags are normalised to uppercase', () => {
	const { format } = createFormatter();
	const result = format('MessageBox mb_yesno "Sure?"\n');
	expect(result).toBe('MessageBox MB_YESNO "Sure?"\n');
});

test('Pipe-separated MessageBox flags are normalised and kept compact', () => {
	const { format } = createFormatter();
	const result = format('MessageBox mb_ok|mb_iconexclamation "Hello"\n');
	expect(result).toBe('MessageBox MB_OK|MB_ICONEXCLAMATION "Hello"\n');
});

test('Boolean parameter is normalised to lowercase', () => {
	const { format } = createFormatter();
	const result = format('Unicode TRUE\n');
	expect(result).toBe('Unicode true\n');
});

test('Enum parameter is normalised to lowercase', () => {
	const { format } = createFormatter();
	const result = format('SetCompressor LZMA\n');
	expect(result).toBe('SetCompressor lzma\n');
});

test('Parameterised prefix flag is normalised', () => {
	const { format } = createFormatter();
	const result = format('VIAddVersionKey /lang=1033 "ProductName" "Demo"\n');
	expect(result).toBe('VIAddVersionKey /LANG=1033 "ProductName" "Demo"\n');
});

test('Quoted string arguments are not normalised', () => {
	const { format } = createFormatter();
	const result = format('Name "TRUE"\n');
	expect(result).toBe('Name "TRUE"\n');
});

test('Variable arguments are not normalised', () => {
	const { format } = createFormatter();
	const result = format('SetOutPath $INSTDIR\n');
	expect(result).toBe('SetOutPath $INSTDIR\n');
});

test('Unknown bare arguments are not normalised', () => {
	const { format } = createFormatter();
	const result = format('File myfile.txt\n');
	expect(result).toBe('File myfile.txt\n');
});

test('ShowWindow constant is normalised to uppercase', () => {
	const { format } = createFormatter();
	const result = format('CreateShortcut /NoWorkingDir "lnk" "target" "" "" 0 sw_shownormal\n');
	expect(result).toBe('CreateShortcut /NoWorkingDir "lnk" "target" "" "" 0 SW_SHOWNORMAL\n');
});

test('MessageBox return value is normalised to uppercase', () => {
	const { format } = createFormatter();
	const result = format('MessageBox MB_YESNO "Sure?" idyes done\n');
	expect(result).toBe('MessageBox MB_YESNO "Sure?" IDYES done\n');
});

// --- Instruction-scoped parameter normalization ---

test('Compiler directive pipe stays compact and args are not normalised', () => {
	const { format } = createFormatter();
	const result = format('!if A|B\n');
	expect(result).toBe('!if A|B\n');
});

test('Compiler directive does not lowercase single-letter args', () => {
	const { format } = createFormatter();
	const result = format('!if A == B\n');
	expect(result).toBe('!if A == B\n');
});

test('FileOpen mode is normalised only for FileOpen', () => {
	const { format } = createFormatter();
	expect(format('FileOpen $0 "file" A\n')).toBe('FileOpen $0 "file" a\n');
});

test('FileOpen mode "a" is not normalised for other instructions', () => {
	const { format } = createFormatter();
	expect(format('StrCpy $0 a\n')).toBe('StrCpy $0 a\n');
});

test('Boolean TRUE is normalised for Unicode but not for unknown instructions', () => {
	const { format } = createFormatter();
	expect(format('Unicode TRUE\n')).toBe('Unicode true\n');
	expect(format('Name TRUE\n')).toBe('Name TRUE\n');
});

test('Registry root key is normalised only for registry instructions', () => {
	const { format } = createFormatter();
	expect(format('WriteRegStr hklm "key" "name" "value"\n')).toBe('WriteRegStr HKLM "key" "name" "value"\n');
	expect(format('StrCpy $0 hklm\n')).toBe('StrCpy $0 hklm\n');
});

test('MessageBox flags are not normalised for other instructions', () => {
	const { format } = createFormatter();
	expect(format('StrCpy $0 mb_ok\n')).toBe('StrCpy $0 mb_ok\n');
});

test('ShowWindow constant is not normalised for non-ShowWindow instructions', () => {
	const { format } = createFormatter();
	expect(format('StrCpy $0 sw_hide\n')).toBe('StrCpy $0 sw_hide\n');
});

test('Slash flags are normalised globally regardless of instruction', () => {
	const { format } = createFormatter();
	expect(format('CopyFiles /silent "src" "dst"\n')).toBe('CopyFiles /SILENT "src" "dst"\n');
	expect(format('Delete /rebootok "file.exe"\n')).toBe('Delete /REBOOTOK "file.exe"\n');
});

// --- Pipe normalization (compact) ---

test('Compact pipe flags stay compact', () => {
	const { format } = createFormatter();
	const result = format('MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "Sure?"\n');
	expect(result).toBe('MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "Sure?"\n');
});

test('Spaced pipe flags are collapsed to compact form', () => {
	const { format } = createFormatter();
	const result = format('MessageBox MB_OK | MB_DEFBUTTON1 "text"\n');
	expect(result).toBe('MessageBox MB_OK|MB_DEFBUTTON1 "text"\n');
});

test('Spaced pipe flags with wrong casing are normalised and collapsed', () => {
	const { format } = createFormatter();
	const result = format('MessageBox mb_ok | mb_iconexclamation "Hello"\n');
	expect(result).toBe('MessageBox MB_OK|MB_ICONEXCLAMATION "Hello"\n');
});

test('Multiple spaced pipe flags are collapsed', () => {
	const { format } = createFormatter();
	const result = format('MessageBox MB_YESNO | MB_ICONQUESTION | MB_DEFBUTTON2 "Sure?"\n');
	expect(result).toBe('MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON2 "Sure?"\n');
});

test('Compiler directive spaced pipe is collapsed', () => {
	const { format } = createFormatter();
	const result = format('!if A | B\n');
	expect(result).toBe('!if A|B\n');
});

test('Asymmetric pipe spacing is normalised to compact (pipe attached to right)', () => {
	const { format } = createFormatter();
	const result = format('MessageBox MB_OK |MB_DEFBUTTON1 "text"\n');
	expect(result).toBe('MessageBox MB_OK|MB_DEFBUTTON1 "text"\n');
});

test('Asymmetric pipe spacing is normalised to compact (pipe attached to left)', () => {
	const { format } = createFormatter();
	const result = format('MessageBox MB_OK| MB_DEFBUTTON1 "text"\n');
	expect(result).toBe('MessageBox MB_OK|MB_DEFBUTTON1 "text"\n');
});

// --- IntOp / IntPtrOp operator splitting ---

test('IntOp compact addition is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1+$2\n')).toBe('IntOp $0 $1 + $2\n');
});

test('IntOp compact subtraction is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1-$2\n')).toBe('IntOp $0 $1 - $2\n');
});

test('IntOp unary minus after operator stays attached', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1+-$2\n')).toBe('IntOp $0 $1 + -$2\n');
});

test('IntOp compact multiplication is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1*$2\n')).toBe('IntOp $0 $1 * $2\n');
});

test('IntOp compact division is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1/$2\n')).toBe('IntOp $0 $1 / $2\n');
});

test('IntOp compact modulo is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1%$2\n')).toBe('IntOp $0 $1 % $2\n');
});

test('IntOp compact bitwise OR is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1|$2\n')).toBe('IntOp $0 $1 | $2\n');
});

test('IntOp compact bitwise AND is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1&$2\n')).toBe('IntOp $0 $1 & $2\n');
});

test('IntOp compact XOR is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1^$2\n')).toBe('IntOp $0 $1 ^ $2\n');
});

test('IntOp compact logical OR is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1||$2\n')).toBe('IntOp $0 $1 || $2\n');
});

test('IntOp compact logical AND is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1&&$2\n')).toBe('IntOp $0 $1 && $2\n');
});

test('IntOp compact shift left is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1<<$2\n')).toBe('IntOp $0 $1 << $2\n');
});

test('IntOp compact shift right is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1>>$2\n')).toBe('IntOp $0 $1 >> $2\n');
});

test('IntOp compact unsigned shift right is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1>>>$2\n')).toBe('IntOp $0 $1 >>> $2\n');
});

test('IntOp unary bitwise NOT is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 ~$1\n')).toBe('IntOp $0 ~ $1\n');
});

test('IntOp unary logical NOT is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 !$1\n')).toBe('IntOp $0 ! $1\n');
});

test('IntOp already-spaced operators are preserved', () => {
	const { format } = createFormatter();
	expect(format('IntOp $0 $1 + $2\n')).toBe('IntOp $0 $1 + $2\n');
});

test('IntPtrOp compact operator with ${} variable is spaced', () => {
	const { format } = createFormatter();
	expect(format('IntPtrOp $0 $0+${NSIS_MAX_STRLEN}\n')).toBe('IntPtrOp $0 $0 + ${NSIS_MAX_STRLEN}\n');
});

test('Non-IntOp instruction does not split operators', () => {
	const { format } = createFormatter();
	expect(format('StrCpy $0 $1+$2\n')).toBe('StrCpy $0 $1+$2\n');
});

// --- Block comments ---

test('Single-line block comment is preserved', () => {
	const { format } = createFormatter();
	const result = format('/* hello */\n');
	expect(result).toBe('/* hello */\n');
});

test('Single-line block comment is indented inside a block', () => {
	const { format } = createFormatter();
	const result = format('Function .onInit\n/* hello */\nFunctionEnd\n');
	expect(result).toBe('Function .onInit\n\t/* hello */\nFunctionEnd\n');
});

test('JSDoc-style block comment preserves star alignment', () => {
	const { format } = createFormatter();
	const result = format('Function .onInit\n/**\n * description\n */\nNop\nFunctionEnd\n');
	expect(result).toBe('Function .onInit\n\t/**\n\t * description\n\t */\n\tNop\nFunctionEnd\n');
});

test('Multi-line block comment is re-indented inside a block', () => {
	const { format } = createFormatter();
	const result = format('Function .onInit\n/*\n line one\n line two\n*/\nNop\nFunctionEnd\n');
	expect(result).toBe('Function .onInit\n\t/*\n\t line one\n\t line two\n\t */\n\tNop\nFunctionEnd\n');
});

test('Multi-line block comment at top level has no indentation', () => {
	const { format } = createFormatter();
	const result = format('/*\n line one\n line two\n*/\n');
	expect(result).toBe('/*\n line one\n line two\n */\n');
});

test('Multi-line block comment with space indentation', () => {
	const { format } = createFormatter({ useTabs: false, indentSize: 2 });
	const result = format('Function .onInit\n/*\n  first\n  second\n*/\nFunctionEnd\n');
	expect(result).toBe('Function .onInit\n  /*\n   first\n   second\n   */\nFunctionEnd\n');
});

// --- Blank lines around blocks ---

for (const trimEmptyLines of [true, false]) {
	const label = `trimEmptyLines: ${trimEmptyLines}`;

	test(`No blank line between nested openers (parent→child) [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Section "test"\n${If} 1 == 1\nNop\n${EndIf}\nSectionEnd\n');
		expect(result).toBe('Section "test"\n\t${If} 1 == 1\n\t\tNop\n\t${EndIf}\nSectionEnd\n');
	});

	test(`Blank line before block opener when preceded by non-block [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Section "test"\nNop\n${If} 1 == 1\nNop\n${EndIf}\nSectionEnd\n');
		expect(result).toBe('Section "test"\n\tNop\n\n\t${If} 1 == 1\n\t\tNop\n\t${EndIf}\nSectionEnd\n');
	});

	test(`Blank line after block closer when followed by non-block [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Section "test"\n${If} 1 == 1\nNop\n${EndIf}\nNop\nSectionEnd\n');
		expect(result).toBe('Section "test"\n\t${If} 1 == 1\n\t\tNop\n\t${EndIf}\n\n\tNop\nSectionEnd\n');
	});

	test(`No blank line between nested closers (child→parent) [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Section "test"\n${If} 1 == 1\nNop\n${EndIf}\nSectionEnd\n');
		expect(!result.includes('\t${EndIf}\n\nSectionEnd')).toBeTruthy();
	});

	test(`Blank line between sibling blocks (close→open) [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Section "a"\nNop\nSectionEnd\nSection "b"\nNop\nSectionEnd\n');
		expect(result).toBe('Section "a"\n\tNop\nSectionEnd\n\nSection "b"\n\tNop\nSectionEnd\n');
	});

	test(`No double blank when blank already exists before block [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Section "test"\nNop\n\n${If} 1 == 1\nNop\n${EndIf}\nSectionEnd\n');
		expect(result).toBe('Section "test"\n\tNop\n\n\t${If} 1 == 1\n\t\tNop\n\t${EndIf}\nSectionEnd\n');
	});

	test(`Blank line before comment that precedes a block opener [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Page instfiles\n# some comment\nSection "test"\nNop\nSectionEnd\n');
		expect(result).toBe('Page instfiles\n\n# some comment\nSection "test"\n\tNop\nSectionEnd\n');
	});

	test(`No double blank when blank already exists before comment + block opener [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Page instfiles\n\n# some comment\nSection "test"\nNop\nSectionEnd\n');
		expect(!result.includes('\n\n\n')).toBeTruthy();
	});

	test(`Multiple comments before a block opener get blank before first [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Page instfiles\n# first\n# second\nSection "test"\nNop\nSectionEnd\n');
		expect(result).toBe('Page instfiles\n\n# first\n# second\nSection "test"\n\tNop\nSectionEnd\n');
	});

	test(`Blank line before goto label [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Function Foo\nNop\ndone:\nNop\nFunctionEnd\n');
		expect(result).toBe('Function Foo\n\tNop\n\n\tdone:\n\tNop\nFunctionEnd\n');
	});

	test(`No double blank when blank already exists before goto label [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Function Foo\nNop\n\ndone:\nNop\nFunctionEnd\n');
		expect(result).toBe('Function Foo\n\tNop\n\n\tdone:\n\tNop\nFunctionEnd\n');
	});

	test(`No blank line between block opener and goto label [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Function Foo\ndone:\nNop\nFunctionEnd\n');
		expect(result).toBe('Function Foo\n\tdone:\n\tNop\nFunctionEnd\n');
	});

	test(`Blank line before comment that precedes a goto label [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Function Foo\nNop\n# some comment\ndone:\nNop\nFunctionEnd\n');
		expect(result).toBe('Function Foo\n\tNop\n\n\t# some comment\n\tdone:\n\tNop\nFunctionEnd\n');
	});

	test(`Comment detached from goto label keeps its position [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Function Foo\nNop\n# some comment\n\ndone:\nNop\nFunctionEnd\n');
		expect(result).toBe('Function Foo\n\tNop\n\n\t# some comment\n\n\tdone:\n\tNop\nFunctionEnd\n');
	});

	test(`No blank line between adjacent goto labels [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Function Foo\nNop\nretry:\nagain:\nNop\nFunctionEnd\n');
		expect(result).toBe('Function Foo\n\tNop\n\n\tretry:\n\tagain:\n\tNop\nFunctionEnd\n');
	});

	test(`Existing blank line between adjacent goto labels is removed [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Function Foo\nNop\nretry:\n\nagain:\nNop\nFunctionEnd\n');
		expect(result).toBe('Function Foo\n\tNop\n\n\tretry:\n\tagain:\n\tNop\nFunctionEnd\n');
	});

	test(`Comment between goto labels keeps the alias run [${label}]`, () => {
		const { format } = createFormatter({ trimEmptyLines });
		const result = format('Function Foo\nNop\nretry:\n# some comment\nagain:\nNop\nFunctionEnd\n');
		expect(result).toBe('Function Foo\n\tNop\n\n\tretry:\n\t# some comment\n\tagain:\n\tNop\nFunctionEnd\n');
	});
}

// --- Switch/Case indentation ---

test('Switch with fall-through cases indents correctly', () => {
	const { format } = createFormatter();
	const input = '${Switch} $0\n${Case} 1\nDetailPrint "one"\n${Case} 2\nDetailPrint "two"\n${EndSwitch}\n';
	expect(format(input)).toBe(
		'${Switch} $0\n\t${Case} 1\n\t\tDetailPrint "one"\n\n\t${Case} 2\n\t\tDetailPrint "two"\n${EndSwitch}\n',
	);
});

test('Switch with Break indents correctly', () => {
	const { format } = createFormatter();
	const input =
		'${Switch} $0\n${Case} 1\nDetailPrint "one"\n${Break}\n${Case} 2\nDetailPrint "two"\n${Break}\n${EndSwitch}\n';
	expect(format(input)).toBe(
		'${Switch} $0\n\t${Case} 1\n\t\tDetailPrint "one"\n\t\t${Break}\n\n\t${Case} 2\n\t\tDetailPrint "two"\n\t\t${Break}\n${EndSwitch}\n',
	);
});

test('Switch with CaseElse indents correctly', () => {
	const { format } = createFormatter();
	const input = '${Switch} $0\n${Case} 1\nDetailPrint "one"\n${CaseElse}\nDetailPrint "else"\n${EndSwitch}\n';
	expect(format(input)).toBe(
		'${Switch} $0\n\t${Case} 1\n\t\tDetailPrint "one"\n\n\t${CaseElse}\n\t\tDetailPrint "else"\n${EndSwitch}\n',
	);
});

test('Switch with Default indents correctly', () => {
	const { format } = createFormatter();
	const input = '${Switch} $0\n${Case} 1\nDetailPrint "one"\n${Default}\nDetailPrint "def"\n${EndSwitch}\n';
	expect(format(input)).toBe(
		'${Switch} $0\n\t${Case} 1\n\t\tDetailPrint "one"\n\n\t${Default}\n\t\tDetailPrint "def"\n${EndSwitch}\n',
	);
});

test('Switch with Case_Else indents correctly', () => {
	const { format } = createFormatter();
	const input = '${Switch} $0\n${Case} 1\nDetailPrint "one"\n${Case_Else}\nDetailPrint "else"\n${EndSwitch}\n';
	expect(format(input)).toBe(
		'${Switch} $0\n\t${Case} 1\n\t\tDetailPrint "one"\n\n\t${Case_Else}\n\t\tDetailPrint "else"\n${EndSwitch}\n',
	);
});

test('Nested switch indents correctly', () => {
	const { format } = createFormatter();
	const input = '${Switch} $0\n${Case} 1\n${Switch} $1\n${Case} a\nDetailPrint "nested"\n${EndSwitch}\n${EndSwitch}\n';
	const result = format(input);
	expect(result.includes('\t${Case} 1')).toBeTruthy();
	expect(result.includes('\t\t${Switch} $1')).toBeTruthy();
	expect(result.includes('\t\t\t${Case} a')).toBeTruthy();
	expect(result.includes('\t\t\t\tDetailPrint "nested"')).toBeTruthy();
	expect(result.includes('\t\t${EndSwitch}')).toBeTruthy();
	expect(result.endsWith('${EndSwitch}\n')).toBeTruthy();
});

test('Select with fall-through cases indents correctly', () => {
	const { format } = createFormatter();
	const input = '${Select} $0\n${Case} 1\nDetailPrint "one"\n${Case} 2\nDetailPrint "two"\n${EndSelect}\n';
	expect(format(input)).toBe(
		'${Select} $0\n\t${Case} 1\n\t\tDetailPrint "one"\n\n\t${Case} 2\n\t\tDetailPrint "two"\n${EndSelect}\n',
	);
});

test('Switch/Case formatting is idempotent', () => {
	const { format } = createFormatter();
	const input =
		'${Switch} $0\n${Case} 1\nDetailPrint "one"\n${Case} 2\nDetailPrint "two"\n${Break}\n${CaseElse}\nDetailPrint "else"\n${EndSwitch}\n';
	const first = format(input);
	const second = format(first);
	expect(first).toBe(second);
});

// --- Loop and inverse-conditional indentation ---

test('While / EndWhile indents correctly', () => {
	const { format } = createFormatter();
	const input = 'Section "x"\n${While} $0 < 3\nNop\n${EndWhile}\nNop\nSectionEnd\n';
	expect(format(input)).toBe('Section "x"\n\t${While} $0 < 3\n\t\tNop\n\t${EndWhile}\n\n\tNop\nSectionEnd\n');
});

test('Unless / EndUnless indents correctly', () => {
	const { format } = createFormatter();
	const input = 'Section "x"\n${Unless} $0 == 1\nNop\n${EndUnless}\nNop\nSectionEnd\n';
	expect(format(input)).toBe('Section "x"\n\t${Unless} $0 == 1\n\t\tNop\n\t${EndUnless}\n\n\tNop\nSectionEnd\n');
});

test('MementoSectionEx / MementoSectionEnd indents correctly', () => {
	const { format } = createFormatter();
	const input = '${MementoSectionEx} "" "x" mid sid\nNop\n${MementoSectionEnd}\n';
	expect(format(input)).toBe('${MementoSectionEx} "" "x" mid sid\n\tNop\n${MementoSectionEnd}\n');
});

// --- Compiler conditional indentation ---

test('!if / !elseif / !else / !endif indents correctly', () => {
	const { format } = createFormatter();
	const input =
		'!if ${X} == 1\nDetailPrint "one"\n!elseif ${X} == 2\nDetailPrint "two"\n!else\nDetailPrint "other"\n!endif\n';
	expect(format(input)).toBe(
		'!if ${X} == 1\n\tDetailPrint "one"\n!elseif ${X} == 2\n\tDetailPrint "two"\n!else\n\tDetailPrint "other"\n!endif\n',
	);
});

// --- Print width / line wrapping ---

test('Line under print width is unchanged', () => {
	const { format } = createFormatter({ printWidth: 80 });
	const result = format('DetailPrint "hello"\n');
	expect(result).toBe('DetailPrint "hello"\n');
});

test('Line exceeding print width is wrapped with continuations', () => {
	const { format } = createFormatter({ printWidth: 40 });
	const result = format('MessageBox MB_OK "A long string value" IDYES true IDNO false\n');
	expect(result).toBe('MessageBox MB_OK "A long string value" \\\n\tIDYES true IDNO false\n');
});

test('Wrapped lines preserve indent level', () => {
	const { format } = createFormatter({ printWidth: 50 });
	const result = format('Section "Test"\nMessageBox MB_OK "A long string value" IDYES true IDNO false\nSectionEnd\n');
	expect(result).toBe(
		'Section "Test"\n\tMessageBox MB_OK "A long string value" IDYES \\\n\t\ttrue IDNO false\nSectionEnd\n',
	);
});

test('Single oversized arg stays on its own line', () => {
	const { format } = createFormatter({ printWidth: 40 });
	const result = format('DetailPrint "This is a very long string that exceeds the print width on its own"\n');
	expect(result).toBe('DetailPrint \\\n\t"This is a very long string that exceeds the print width on its own"\n');
});

test('Trailing comment stays on last wrapped line', () => {
	const { format } = createFormatter({ printWidth: 40 });
	const result = format('MessageBox MB_OK "A long string value" IDYES true IDNO false ; a comment\n');
	expect(result.endsWith('IDNO false ; a comment\n')).toBeTruthy();
	expect(result.includes(' \\\n')).toBeTruthy();
});

test('Print width 0 disables wrapping', () => {
	const { format } = createFormatter({ printWidth: 0 });
	const result = format('MessageBox MB_OK "A long string value" IDYES true IDNO false\n');
	expect(result).toBe('MessageBox MB_OK "A long string value" IDYES true IDNO false\n');
});

test('Line wrapping is idempotent', () => {
	const { format } = createFormatter({ printWidth: 40 });
	const input = 'MessageBox MB_OK "A long string value" IDYES true IDNO false\n';
	const first = format(input);
	const second = format(first);
	expect(first).toBe(second);
});

test('Doubled quotes are preserved in command lines', () => {
	const { format } = createFormatter();

	// Regression: doubled quotes are meaningful to cmd.exe and must survive verbatim.
	const input = 'nsExec::Exec \'$INSTDIR\\ssm.exe -c ""$RootDir\\conf"" -l quiet\'\n';

	expect(format(input)).toBe(input);
});
