# NSIS Highlighter Feature Comparison

## Highlighter Packages

| Package               | Format                    | Location          |
| --------------------- | ------------------------- | ----------------- |
| **@nsis/ace-mode**    | Ace Editor (regex)        | monorepo          |
| **@nsis/codemirror**  | CodeMirror 6 / Lezer      | monorepo          |
| **@nsis/highlightjs** | highlight.js              | monorepo          |
| **@nsis/prismjs**     | Prism.js                  | monorepo          |
| **@nsis/textmate**    | TextMate JSON (Shiki)     | monorepo          |
| **@nsis/lumis**       | Lumis (wraps tree-sitter) | monorepo          |
| **tree-sitter-nsis**  | tree-sitter               | standalone repo   |
| **lang-nsis**         | Lezer (standalone)        | standalone repo   |
| **vscode-nsis**       | TextMate JSON             | VS Code extension |
| **zed-nsis**          | tree-sitter (wasm)        | Zed extension     |
| **language-nsis-lsp** | tree-sitter queries       | Atom/Pulsar       |

## Feature Comparison

| Feature                        | ace | codemirror | hljs | prism | textmate | tree-sitter | atom |
| ------------------------------ | :-: | :--------: | :--: | :---: | :------: | :---------: | :--: |
| **Core commands (~220)**       | ✅  |     ✅     |  ✅  |  ✅   |    ✅    |     ✅      |  ✅  |
| **Deprecated commands**        | ❌  |     ❌     |  ❌  |  ❌   |    ✅    |     ✅      |  ✅  |
| **Preprocessor directives**    | ✅  |     ✅     |  ✅  |  ✅   |    ✅    |     ✅      |  ✅  |
| **Preproc conditionals**       | ✅  |     ✅     |  ✅  |  ✅   |    ✅    |     ✅      |  ✅  |
| **Plugin calls (`::`)**        | ✅  |     ✅     |  ✅  |  ❌   |    ✅    |     ✅      |  ✅  |
| **Block structure (AST)**      | ❌  |     ✅     |  ❌  |  ❌   |    ❌    |     ✅      |  ✅  |
| **Labels**                     | ❌  |     ✅     |  ❌  |  ❌   |    ❌    |     ✅      |  ✅  |
| **LogicLib macros**            | ❌  |     ❌     |  ❌  |  ❌   |    ✅    |     ✅      |  ❌  |
| **FileFunc/TextFunc/WordFunc** | ❌  |     ❌     |  ❌  |  ❌   |    ✅    |     ✅      |  ❌  |
| **WinVer.nsh macros**          | ✅¹ |     ❌     |  ❌  |  ❌   |    ✅    |     ✅      |  ❌  |
| **Memento.nsh macros**         | ❌  |     ❌     |  ❌  |  ❌   |    ✅    |     ✅      |  ❌  |
| **x64.nsh macros**             | ❌  |     ❌     |  ❌  |  ❌   |    ✅    |     ✅      |  ❌  |
| **Built-in variables**         | ❌² |     ❌     |  ✅  |  ❌   |    ✅    |     ✅      |  ✅  |
| **Slash options**              | ✅  |    ✅³     |  ❌  |  ❌   |    ✅    |     ✅³     | ✅³  |
| **String interpolation**       | ✅  |     ✅     |  ✅  |  ❌   |    ✅    |     ✅      |  ✅  |
| **Backtick strings**           | ✅  |     ✅     |  ✅  |  ❌   |    ✅    |     ✅      |  ✅  |
| **Line continuations**         | ❌  |     ✅     |  ❌  |  ❌   |    ✅    |     ✅      |  ✅  |
| **Comparison operators**       | ✅  |     ❌     |  ❌  |  ✅   |    ✅    |     ✅      |  ✅  |
| **Booleans**                   | ✅  |     ❌     |  ❌  |  ❌   |    ✅    |     ✅      |  ✅  |

¹ WinVer constants only, not as `function.builtin`
² All `$word` highlighted uniformly — no built-in distinction
³ Generic `/flag` token, not individually enumerated

## Key Observations

**Most complete:** **tree-sitter-nsis** and **@nsis/textmate** are the two richest grammars. tree-sitter-nsis has the broadest header macro coverage (LogicLib, FileFunc, WordFunc, TextFunc, WinVer, Memento, x64, Sections, StrContains) and produces a full syntax tree. textmate is close behind with most of the same macros.

**Most gaps:** **@nsis/prismjs** has the most missing features — no plugin calls, no backtick strings, no string interpolation, no labels, no line continuations, no booleans. **@nsis/highlightjs** is similarly lean but does handle string interpolation and plugins.

**Middle tier:** **@nsis/ace-mode** and **@nsis/codemirror** cover the core well but miss header library macros (LogicLib, FileFunc, etc.) and some secondary features.

**Atom queries lag behind:** Despite using tree-sitter-nsis, the Atom/Pulsar highlight queries don't include `macro_invocation` patterns, so LogicLib/FileFunc/etc. macros go unhighlighted — an easy fix by porting the patterns from the main highlights.scm.
