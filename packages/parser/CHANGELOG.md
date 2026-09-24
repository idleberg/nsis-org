# @nsis/parser

## 0.2.0

### Minor Changes

- 0ecfbac: - unknown keywords are no longer an error
  - unterminated strings are no longer parsed as bare tokens
  - block comment values are now stored relative to the `/*à indentation
  - comment values no longer keep trailing whitespace

### Patch Changes

- 0ecfbac: - ; and # inside tokens
  - continuation joining without a space
  - unknown compiler commands kept as written
  - lone cr as a line break

## 0.1.2

### Patch Changes

- a66b7ae: report parse errors at their real source position
- c91e1bb: stop treating "" as an in-string escape

## 0.1.1

### Patch Changes

- e5330f7: add `publishConfig`

## 0.1.0

### Minor Changes

- 5ccc1e9: separate language parser from dent package
