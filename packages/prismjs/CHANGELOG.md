# @nsis/prismjs

## 0.10.6

### Patch Changes

- e7eba33: Stop highlighting `!elseif`, `!elseifdef`, `!elseifmacrodef`, `!elseifmacrondef` and
  `!elseifndef` as compiler directives. NSIS has no such commands: `!else` takes the condition as
  a separate token (`!else ifdef FOO`), as `Source/tokens.cpp` and the `TOK_P_ELSE` branch of
  `Source/script.cpp` show. A script using the merged spelling does not compile.

## 0.10.5

### Patch Changes

- 8e7bb0a: fix: highlighter conditions after `!else`

## 0.10.4

### Patch Changes

- 9e1e21a: Fix the `files` allowlist, which was inert due to a typo and caused sources to be published alongside the bundle

## 0.10.3

### Patch Changes

- e5330f7: add `publishConfig`

## 0.10.2

### Patch Changes

- 34abcfc: fix: typo usage guide

## 0.10.1

### Patch Changes

- e28b744: update tooling
