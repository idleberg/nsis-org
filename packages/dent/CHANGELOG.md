# @nsis/dent

## 0.17.0

### Minor Changes

- e7eba33: Generate the lookup tables from `@nsis/dent-spec` and run its conformance cases, so Dent and
  Ardent can no longer drift apart.
  
  Two behavioural changes come out of this:
  
  - `$(^ComponentsSubText2_NoInstTypes)` and `$(^UnComponentsSubText2_NoInstTypes)` are now
    recased like every other built-in language string. They were missing from the table.
  - End-of-line detection follows §4 of the specification: with `endOfLine` unset, the output is
    LF only when the input contains an LF and no CRLF. Previously the most frequent ending won, so
    a mostly-LF file with a stray CRLF was written as LF and is now written as CRLF. Set
    `endOfLine` explicitly to opt out of detection entirely.
  
  The `detect-newline` dependency is gone as a result.
- 0ecfbac: - options outside the schema now throw where they used to be accepted
  - end-of-line detection changed, which can flip the output for mixed-ending files
  - tables are generated from the spec, which adds two language strings

### Patch Changes

- 0ecfbac: - comment trailing whitespace, compact piped values, code-point width, trailing comments left out of the width, block comment indentation, mid/closeAfter blank lines, empty input, lone CR, and indentSize: undefined
- Updated dependencies [0ecfbac]
- Updated dependencies [0ecfbac]
  - @nsis/parser@0.2.0

## 0.16.1

### Patch Changes

- 271970b: fix: remove unused compiler keywords

## 0.16.0

### Minor Changes

- 700ed2a: add commentStyle option

## 0.15.0

### Minor Changes

- 3772875: write empty line before label

## 0.14.1

### Patch Changes

- 29fec7f: fix indentation of `${While}` and `${EndUnless}` blocks
- 4792830: normalise the casing of some macros

## 0.14.0

### Minor Changes

- 862c327: Normalize the casing of NSIS built-in variables (`$instdir` → `$INSTDIR`, `$r0` → `$R0`), built-in defines (`${nsisdir}` → `${NSISDIR}`) and built-in language strings (`$(^name)` → `$(^Name)`). Custom variables, custom defines, third-party macros, environment variables (`$%windir%`) and escape sequences (`$$`, `$\n`) are left exactly as typed
- c91e1bb: normalize casing of NSIS built-in variables and defines

### Patch Changes

- Updated dependencies [a66b7ae]
- Updated dependencies [c91e1bb]
  - @nsis/parser@0.1.2

## 0.13.1

### Patch Changes

- e5330f7: add `publishConfig`
- Updated dependencies [e5330f7]
  - @nsis/parser@0.1.1

## 0.13.0

### Minor Changes

- 444b78b: refactor!: remove os-specific line-end detection, default to crlf

## 0.12.3

### Patch Changes

- 5ccc1e9: separate language parser from dent package
- Updated dependencies [5ccc1e9]
  - @nsis/parser@0.1.0

## 0.12.2

### Patch Changes

- ccec13a extract blank-line transforms
- 2897e97 extract token transforms from printer

## 0.12.1

### Patch Changes

- fcc32f4: implement various fixes from corpus checks

## 0.12.0

### Minor Changes

- 0b4f621: feat: support quote normalization

## 0.11.2

### Patch Changes

- 206c514: fix: handle escaped single quotes and backticks

## 0.11.1

### Patch Changes

- e8e44b1: fix: support !elseif

## 0.11.0

### Minor Changes

- 2deb0be: indent wrapped lines
