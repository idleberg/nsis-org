# NSIS Highlighter Feature Parity

Divergences in the actual keyword/token lists between packages that nominally support the same features.

## Core Commands

All packages claim ~220 commands, but:

| Missing Command        | From                                                                         |
| ---------------------- | ---------------------------------------------------------------------------- |
| `ManifestDPIAwareness` | textmate (has `ManifestDPIAware` but `\b` prevents matching the longer form) |
| `SectionInstType`      | textmate, highlightjs                                                        |

## Preprocessor Directives

| Missing Directive                                                             | From                 |
| ----------------------------------------------------------------------------- | -------------------- |
| `!elseif`, `!elseifdef`, `!elseifndef`, `!elseifmacrodef`, `!elseifmacrondef` | codemirror, textmate |
| `!appendmemfile`                                                              | textmate             |

The codemirror Lezer grammar only has `!else` — the five `!elseif*` variants aren't assigned a token. The textmate `keyword.control` regex `!(ifdef|ifndef|if|...|else|endif)\b` can't match `!elseif` because there's no word boundary between `else` and `if`.

## Built-in Variables

Only hljs, textmate, and tree-sitter distinguish built-ins from generic `$word`:

| Missing Variable                                  | From                                                   |
| ------------------------------------------------- | ------------------------------------------------------ |
| `$NSIS_MAX_STRLEN`, `$NSIS_VERSION`, `$NSISDIR`   | highlightjs                                            |
| `${__DATE__}`, `${__FILE__}`, `${__LINE__}`, etc. | highlightjs, tree-sitter (handled as generic `${...}`) |

## Constants/Attributes

| Missing Constants                                                   | From                                 |
| ------------------------------------------------------------------- | ------------------------------------ |
| `SYSTEM`, `TEMPORARY`                                               | highlightjs                          |
| `SW_SHOW`                                                           | textmate (only has `SW_SHOWDEFAULT`) |
| `SW_SHOWDEFAULT`                                                    | ace, prismjs, highlightjs            |
| `IDD_*` (7 dialog IDs), `HIDDEN`, `NORMAL`, `FILE_ATTRIBUTE_HIDDEN` | ace, prismjs, highlightjs            |

## Option Values/Literals

| Missing Literals                     | From                    |
| ------------------------------------ | ----------------------- |
| `colored`, `open`, `print`, `smooth` | codemirror, textmate    |
| `Win10`, `Win7`, `Win8`, `WinVista`  | codemirror              |
| `x86-ansi`, `x86-unicode`            | codemirror, highlightjs |
| `amd64-unicode`                      | highlightjs             |
| `default` (extra, not in others)     | only in codemirror      |

## Header Macros (textmate vs tree-sitter)

Tree-sitter is a strict superset of textmate — textmate is missing ~50 macros:

- **LogicLib conditions:** `Abort`, `Errors`, `FileExists`, `RebootFlag`, `Silent`, `Cmd`, etc.
- **String tests:** `Contains`, `EndsWith`, `StartsWith`, `IsLowerCase`, `IsUpperCase` (+ `S` variants)
- **Section tests:** `SectionIsBold`, `SectionIsSelected`, `SectionIsExpanded`, etc.
- **WinVer extras:** `IsDomainController`, `IsServerOS`, `AtLeastBuild`, `AtLeastWaaS`, `WinVerGetBuild`, etc.
- **x64 extras:** `GetNativeMachineArchitecture`, `IsNativeAMD64`, `IsNativeARM64`, `IsWow64`, etc.
- **Memento:** `MementoSectionEx`

## Summary

| Area                    | Most Complete                      | Notable Gaps                                        |
| ----------------------- | ---------------------------------- | --------------------------------------------------- |
| Core commands           | ace/prismjs/codemirror/tree-sitter | textmate missing 2, hljs missing 1                  |
| Preprocessor directives | ace/prismjs/hljs                   | codemirror missing 5 `!elseif*`; textmate missing 6 |
| Built-in variables      | textmate/tree-sitter               | hljs missing 3                                      |
| Constants               | tree-sitter                        | hljs missing 2; ace/prismjs missing 12              |
| Option literals         | ace/prismjs                        | codemirror missing 11; hljs missing 3               |
| Header macros           | tree-sitter (far ahead)            | textmate missing ~50; others have none              |

The shared `data/language.jsonc` feeds ace-mode and prismjs so those two are always in sync. The real drift happens in packages that maintain their own keyword lists independently (textmate, highlightjs, codemirror).
