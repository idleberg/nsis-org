# @nsis/dent

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
