---
'@nsis/highlightjs': patch
'@nsis/prismjs': patch
'@nsis/ace-mode': patch
---

Stop highlighting `!elseif`, `!elseifdef`, `!elseifmacrodef`, `!elseifmacrondef` and
`!elseifndef` as compiler directives. NSIS has no such commands: `!else` takes the condition as
a separate token (`!else ifdef FOO`), as `Source/tokens.cpp` and the `TOK_P_ELSE` branch of
`Source/script.cpp` show. A script using the merged spelling does not compile.
