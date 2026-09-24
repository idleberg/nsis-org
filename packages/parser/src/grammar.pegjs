// NSIS Script Grammar
// Produces: CSTNode[] — a flat list of parsed lines
// Keywords sourced from: makensis -CMDHELP

{{
const COMPILER_KEYWORDS = new Set([
  '!addincludedir', '!addplugindir', '!appendfile', '!appendmemfile', '!assert',
  '!cd', '!define', '!delfile', '!echo', '!else', '!endif', '!error', '!execute',
  '!finalize', '!getdllversion', '!gettlbversion', '!if', '!ifdef', '!ifmacrodef',
  '!ifmacrondef', '!ifndef', '!include', '!insertmacro', '!macro', '!macroend',
  '!macroundef', '!makensis', '!packhdr', '!pragma', '!searchparse', '!searchreplace',
  '!system', '!tempfile', '!undef', '!uninstfinalize', '!verbose', '!warning',
]);

const INSTRUCTION_KEYWORDS = [
  'Abort', 'AddBrandingImage', 'AddSize', 'AllowRootDirInstall', 'AllowSkipFiles',
  'AutoCloseWindow',
  'BGFont', 'BGGradient', 'BrandingText', 'BringToFront',
  'Call', 'CallInstDLL', 'Caption', 'ChangeUI', 'CheckBitmap', 'ClearErrors',
  'CompletedText', 'ComponentText', 'CopyFiles', 'CPU', 'CRCCheck', 'CreateDirectory',
  'CreateFont', 'CreateShortcut',
  'Delete', 'DeleteINISec', 'DeleteINIStr', 'DeleteRegKey', 'DeleteRegValue',
  'DetailPrint', 'DetailsButtonText', 'DirShow', 'DirText', 'DirVar', 'DirVerify',
  'EnableWindow', 'EnumRegKey', 'EnumRegValue', 'Exch', 'Exec', 'ExecShell',
  'ExecShellWait', 'ExecWait', 'ExpandEnvStrings',
  'File', 'FileBufSize', 'FileClose', 'FileErrorText', 'FileOpen', 'FileRead',
  'FileReadByte', 'FileReadUTF16LE', 'FileReadWord', 'FileSeek', 'FileWrite',
  'FileWriteByte', 'FileWriteUTF16LE', 'FileWriteWord', 'FindClose', 'FindFirst',
  'FindNext', 'FindWindow', 'FlushINI', 'Function', 'FunctionEnd',
  'GetCurInstType', 'GetCurrentAddress', 'GetDlgItem', 'GetDLLVersion',
  'GetDLLVersionLocal', 'GetErrorLevel', 'GetFileTime', 'GetFileTimeLocal',
  'GetFullPathName', 'GetFunctionAddress', 'GetInstDirError', 'GetKnownFolderPath',
  'GetLabelAddress', 'GetRegView', 'GetShellVarContext', 'GetTempFileName', 'GetWinVer',
  'Goto',
  'HideWindow',
  'Icon', 'IfAbort', 'IfAltRegView', 'IfErrors', 'IfFileExists', 'IfRebootFlag',
  'IfRtlLanguage', 'IfShellVarContextAll', 'IfSilent', 'InitPluginsDir',
  'InstallButtonText', 'InstallColors', 'InstallDir', 'InstallDirRegKey',
  'InstProgressFlags', 'InstType', 'InstTypeGetText', 'InstTypeSetText',
  'Int64Cmp', 'Int64CmpU', 'Int64Fmt', 'IntCmp', 'IntCmpU', 'IntFmt', 'IntOp',
  'IntPtrCmp', 'IntPtrCmpU', 'IntPtrOp', 'IsWindow',
  'LangString', 'LangStringUP', 'LicenseBkColor', 'LicenseData',
  'LicenseForceSelection', 'LicenseLangString', 'LicenseText', 'LoadAndSetImage',
  'LoadLanguageFile', 'LockWindow', 'LogSet', 'LogText',
  'ManifestAppendCustomString', 'ManifestDisableWindowFiltering', 'ManifestDPIAware',
  'ManifestDPIAwareness', 'ManifestGdiScaling', 'ManifestLongPathAware',
  'ManifestMaxVersionTested', 'ManifestSupportedOS', 'MessageBox', 'MiscButtonText',
  'Name', 'Nop',
  'OutFile',
  'Page', 'PageCallbacks', 'PageEx', 'PageExEnd', 'PEAddResource',
  'PEDllCharacteristics', 'PERemoveResource', 'PESubsysVer', 'Pop', 'Push',
  'Quit',
  'ReadEnvStr', 'ReadINIStr', 'ReadMemory', 'ReadRegDWORD', 'ReadRegStr', 'Reboot',
  'RegDLL', 'Rename', 'RequestExecutionLevel', 'ReserveFile', 'Return', 'RMDir',
  'SearchPath', 'Section', 'SectionEnd', 'SectionGetFlags', 'SectionGetInstTypes',
  'SectionGetSize', 'SectionGetText', 'SectionGroup', 'SectionGroupEnd', 'SectionIn',
  'SectionInstType', 'SectionSetFlags', 'SectionSetInstTypes', 'SectionSetSize',
  'SectionSetText', 'SendMessage', 'SetAutoClose', 'SetBrandingImage', 'SetCompress',
  'SetCompressionLevel', 'SetCompressor', 'SetCompressorDictSize', 'SetCtlColors',
  'SetCurInstType', 'SetDatablockOptimize', 'SetDateSave', 'SetDetailsPrint',
  'SetDetailsView', 'SetErrorLevel', 'SetErrors', 'SetFileAttributes', 'SetFont',
  'SetOutPath', 'SetOverwrite', 'SetPluginUnload', 'SetRebootFlag', 'SetRegView',
  'SetShellVarContext', 'SetSilent', 'ShowInstDetails', 'ShowUninstDetails',
  'ShowWindow', 'SilentInstall', 'SilentUnInstall', 'Sleep', 'SpaceTexts',
  'StrCmp', 'StrCmpS', 'StrCpy', 'StrLen', 'SubCaption', 'SubSection', 'SubSectionEnd',
  'Target',
  'Unicode', 'UninstallButtonText', 'UninstallCaption', 'UninstallExeName',
  'UninstallIcon', 'UninstallSubCaption', 'UninstallText', 'UninstPage', 'UnRegDLL',
  'UnsafeStrCpy',
  'Var', 'VIAddVersionKey', 'VIFileVersion', 'VIProductVersion',
  'WindowIcon', 'WriteINIStr', 'WriteRegBin', 'WriteRegDWORD', 'WriteRegExpandStr',
  'WriteRegMultiStr', 'WriteRegNone', 'WriteRegStr', 'WriteUninstaller',
  'XPStyle',
];

const INSTRUCTION_LOOKUP = new Set(INSTRUCTION_KEYWORDS.map(kw => kw.toLowerCase()));

// Makes a block comment's inner lines relative to the indentation of its opening `/*` (spec §11).
// A line that does not start with that exact indentation is dedented fully instead.
function rebaseBlockComment(value, indent) {
  return value
    .split(/\r\n?|\n/)
    .map((line, i) => (i === 0 ? line : line.startsWith(indent) ? line.slice(indent.length) : line.trimStart()))
    .join('\n');
}
}}

Script
  = lines:Line* { return lines.flat(); }

Line
  = BlockComment
  / BlankLine
  / CommentLine
  / LabelWithInstruction
  / QuotedLabelLine
  / LabelLine
  / InstructionLine

BlankLine
  = _ EOL { return { type: 'blank' }; }
  / [ \t]+ EOF { return { type: 'blank' }; }

CommentLine
  = _ style:("#" / ";") value:$[^\r\n]* LineEnd
  { return { type: 'comment', style: style === '#' ? 'hash' : 'semicolon', value: value.trim() }; }

BlockComment
  = indent:$_ "/*" value:$(!"*/" (. / [\r\n]))* "*/" _ LineEnd?
  { return { type: 'comment', style: 'block', value: rebaseBlockComment(value, indent) }; }

QuotedLabelLine
  = _ "\"" label:$((!(":\"") [^"])*) ":\"" !":" trailing:TrailingComment? _ LineEnd
  { return { type: 'label', name: label, comment: trailing ?? undefined }; }

LabelLine
  = _ label:$(LabelSegment+) ":" !":" trailing:TrailingComment? _ LineEnd
  { return { type: 'label', name: label, comment: trailing ?? undefined }; }

LabelWithInstruction
  = _ label:$(LabelSegment+) ":" !":" _ keyword:Keyword args:Arguments trailing:TrailingComment? _ LineEnd
  { return [
      { type: 'label', name: label },
      { type: 'instruction', keyword, args, ...(trailing ? { comment: trailing } : {}) },
    ];
  }

LabelSegment
  = "${" LabelBraceInner* "}"
  / [a-zA-Z0-9_.\-/]

LabelBraceInner
  = "${" LabelBraceInner* "}"
  / (!"}" .)

InstructionLine
  = _ keyword:Keyword args:Arguments trailing:TrailingComment? _ LineEnd
  {
    const node = { type: 'instruction', keyword, args };
    if (trailing) node.comment = trailing;
    return node;
  }

// --- Keywords ---

Keyword "keyword"
  = CompilerKeyword
  / MacroKeyword
  / PluginCallKeyword
  / InstructionKeyword
  / UnknownKeyword

CompilerKeyword
  = kw:$("!" [a-zA-Z]+) &{ return COMPILER_KEYWORDS.has(kw.toLowerCase()); } { return kw; }


MacroKeyword
  = $("${" MacroKeywordInner+ "}")

MacroKeywordInner
  = "${" MacroKeywordInner+ "}"
  / !("${" / "}") [^ \t\r\n]

PluginCallKeyword
  = $([a-zA-Z][a-zA-Z0-9_]* "::" [a-zA-Z_][a-zA-Z0-9_]*)

InstructionKeyword
  = kw:$([a-zA-Z][a-zA-Z0-9]*) &{ return INSTRUCTION_LOOKUP.has(kw.toLowerCase()); } { return kw; }

// Spec §6.4: a keyword in none of the tables is kept as written, compiler commands included.
UnknownKeyword
  = $("!"? [a-zA-Z_][a-zA-Z0-9_]*)

// --- Arguments ---

Arguments
  = args:(_ @Argument)* { return args; }

Argument "argument"
  = QuotedString
  / BareToken

QuotedString
  = $( '"' ('$\\"' / [^"\r\n])* '"' )
  / $( "'" ("$\\'" / [^'\r\n])* "'" )
  / $( '`' ('$\\`' / [^`\r\n])* '`' )

BareToken
  // An unmatched opening quote is an unterminated string, not a bare token (spec §2).
  // `;` and `#` only start a comment at the beginning of a token, as in makensis (spec §11.1).
  = !["'`;#] @$[^ \t\r\n]+

// --- Comments ---

TrailingComment
  = _ style:("#" / ";") value:$[^\r\n]*
  { return { style: style === '#' ? 'hash' : 'semicolon', value: value.trim() }; }

// --- Primitives ---

_ "whitespace"
  = [ \t]*

EOL "end of line"
  = "\r\n" / "\n" / "\r"

LineEnd
  = EOL / EOF

EOF
  = !.
