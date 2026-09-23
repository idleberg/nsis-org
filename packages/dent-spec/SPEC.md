# Dent Style Specification

**Version:** 1.0.0-draft · **Status:** draft

Dent style is an opinionated formatting style for [NSIS](https://nsis.sourceforge.io/) scripts.
This document, together with the data files in `tables/` and the conformance cases in `cases/`,
defines it.

Known implementations:

| Implementation | Language | Package |
| --- | --- | --- |
| [Dent](https://github.com/idleberg/nsis-org/tree/main/packages/dent) | TypeScript | `@nsis/dent` |
| [Ardent](https://github.com/idleberg/ardent) | Rust | `ardent` |

"Dent" names the style. `@nsis/dent` is one implementation of it, not the authority over it:
where an implementation disagrees with this document, the implementation is wrong.

## 1. Conformance

The key words MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT, RECOMMENDED, MAY
and OPTIONAL are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119)
and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).

### 1.1 What is specified

This specification defines one operation:

```
format(source: text, options: Options) -> text | error
```

An implementation conforms to a version of this specification if, for every case in that
version's `cases/` directory, `format` returns the case's `output.nsi` **byte for byte** when
given its `input.nsi` and its `options.toml` — or returns an error when the case ships an
`error` marker instead of an `output.nsi`.

The following are **not** specified, and are described only informally in Appendix A:
command line interfaces, exit codes, file discovery, file encoding and byte order marks,
and diagnostic message wording.

### 1.2 Conformance cases

A case is a directory under `cases/`, named `<area>/<name>`:

| File | Required | Meaning |
| --- | --- | --- |
| `input.nsi` | yes | Source handed to `format`, byte for byte |
| `output.nsi` | unless `error` | The only accepted result |
| `error` | unless `output.nsi` | `format` MUST return an error; its wording is unspecified |
| `options.toml` | no | Options for this case; absent means the defaults in §3 |

Case files are byte-exact: line endings, trailing whitespace and the presence or absence of a
final newline are all significant, and MUST NOT be normalised by tooling.

### 1.3 Idempotency

For every case with an `output.nsi`, formatting that output again with the same options MUST
return it unchanged. Formatting is idempotent: applying it twice is the same as applying it once.

### 1.4 Versioning

Releases follow semantic versioning, interpreted for a formatter:

- **MAJOR** — an option's default changes, an option is removed, or a style rule is deliberately
  reversed.
- **MINOR** — rules are added, table entries are added, or output changes to fix a defect.
- **PATCH** — editorial changes only; no case output changes.

Output-affecting changes therefore ship in MINOR releases. Users who need byte-stable output
across upgrades SHOULD pin an exact version.

An implementation SHOULD state which version of this specification it conforms to.

## 2. Processing model

An implementation MUST behave as if it performed these steps in order:

1. **Preprocess** — strip a leading byte order mark, then join backslash continuation lines
   (a `\` at end of line) into single logical lines.
2. **Parse** — build a concrete syntax tree of instructions, labels, comments and blank lines.
   Every byte of the input is represented; nothing is discarded.
3. **Print** — emit each node with canonical casing, normalised arguments, and the indentation
   of §5, joining lines with the end-of-line sequence of §4.

Input that cannot be parsed MUST produce an error; an implementation MUST NOT emit
partially-formatted output for it.

Constructs the specification says nothing about MUST be preserved as written. In particular, an
unrecognised instruction keyword keeps its author's spelling (§6.4).

Examples: `cases/preprocessing/byte-order-mark`, `cases/preprocessing/continuations`,
`cases/preprocessing/unterminated-string`.

## 3. Options

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `comment_style` | `"hash"` \| `"semi"` \| unset | unset | Marker for single-line comments (§11.2) |
| `end_of_line` | `"lf"` \| `"crlf"` \| unset | unset | Line ending; unset means detect (§4) |
| `indent_size` | integer ≥ 0 | `2` | Spaces per level; ignored when `use_tabs` (§5.1) |
| `print_width` | integer ≥ 0 | `120` | Wrap column; `0` disables wrapping (§10) |
| `single_quote` | boolean | `false` | Prefer `'` over `"` (§9) |
| `trim_empty_lines` | boolean | `true` | Collapse and strip blank lines (§7.2) |
| `use_tabs` | boolean | `true` | Indent with tabs (§5.1) |

Keys are snake_case in `options.toml`; an implementation MAY expose them under its own naming
convention. `schemas/options.schema.json` is the normative schema.

### 3.1 Validation

An implementation MUST reject options where `use_tabs` is `false` and `indent_size` is not a
positive integer. All other combinations MUST be accepted.

Examples: `cases/options/invalid-indent-size`.

## 4. End of line

When `end_of_line` is set, every line ending in the output MUST be `\n` for `"lf"` or `\r\n`
for `"crlf"`.

When `end_of_line` is unset, the ending is detected from the input:

1. If the input contains at least one `\n` and no `\r\n`, the output uses `\n`.
2. Otherwise the output uses `\r\n`. An input with no line ending at all therefore yields `\r\n`.

A single CRLF anywhere in an otherwise LF input is enough to make the output CRLF: the rule is
deliberately conservative, so a file that carries any Windows endings keeps them.

The output MUST end with exactly one line ending.

Examples: `cases/end-of-line/crlf-explicit`, `cases/end-of-line/lf-explicit`,
`cases/end-of-line/detect-mixed`, `cases/end-of-line/no-line-ending`.

## 5. Indentation

### 5.1 Indent unit

One level of indentation is one tab when `use_tabs` is `true`, and `indent_size` spaces
otherwise. A line at level *n* is prefixed by the unit repeated *n* times. Blank lines carry no
indentation.

Examples: `cases/indentation/tabs`, `cases/indentation/spaces`, `cases/indentation/spaces-four`.

### 5.2 Keyword roles

`tables/blocks.json` assigns each block keyword one of five roles. Given a level counter starting
at 0 and a stack of saved levels:

| Role | Printed at | Effect |
| --- | --- | --- |
| `open` | current level | push current level, then level += 1 |
| `close` | popped level | pop the stack into level, then print |
| `mid` | level on top of stack | none |
| `case` | top of stack + 1 | level = that + 1 |
| `closeAfter` | current level | level = top of stack + 1 |

Any other instruction is printed at the current level and changes nothing. When the stack is
empty, a `close`, `mid`, `case` or `closeAfter` keyword behaves as if the saved level were 0, so
unbalanced input still formats.

Examples: `cases/blocks/sections`, `cases/blocks/nested-sectiongroup`, `cases/blocks/macro`,
`cases/blocks/compiler-if`, `cases/blocks/while-loop`.

### 5.3 Conditionals

`mid` keywords such as `${Else}`, `${AndIf}` and `!else` print at the level of the keyword that
opened the block and leave the level unchanged, so the body below them stays indented.

Examples: `cases/blocks/logiclib-if-else`, `cases/blocks/logiclib-and-if`.

### 5.4 Case arms

A `case` keyword prints one level inside its enclosing `${Switch}` or `${Select}`, and its body
one level further. Consecutive arms therefore align regardless of how the input was indented,
and `${Break}` (a `closeAfter` keyword) returns to the arm's own level.

Examples: `cases/blocks/switch-case`.

## 6. Casing

### 6.1 Instructions and compiler commands

An instruction keyword whose lowercased spelling appears in `tables/casing.json` MUST be printed
with the canonical spelling listed there. Compiler commands are lowercase by convention
(`!define`, `!include`); instructions use the documentation's mixed case (`DetailPrint`,
`WriteRegStr`).

Examples: `cases/casing/instructions`.

### 6.2 Include library macros

A keyword whose lowercased spelling appears in `tables/includes.json` MUST be printed with the
canonical spelling listed there. These are the macros of the bundled include libraries
(`LogicLib.nsh`, `FileFunc.nsh`, `x64.nsh` and friends), written with their `${…}` delimiters.

Examples: `cases/casing/include-macros`.

### 6.3 Built-in variables, defines and language strings

Inside arguments, the following MUST be rewritten to the canonical spellings in
`tables/variables.json`:

- `$name` — built-in variables, e.g. `$instdir` becomes `$INSTDIR`.
- `${name}` — built-in defines, e.g. `${nsisdir}` becomes `${NSISDIR}`.
- `$(^name)` — built-in language strings, e.g. `$(^name)` becomes `$(^Name)`.

Built-in names cannot be shadowed by user declarations, which is what makes rewriting them safe.
The following MUST be left untouched: user-defined variables and defines, environment variables
(`$%PATH%`), and escape sequences (`$$`, `$\n`, `$\r`, `$\t`, `$\"`, `$\'`, ``$\` ``).

Examples: `cases/casing/builtin-variables`.

### 6.4 Unknown keywords

A keyword in none of the tables MUST be printed exactly as written. An implementation MUST NOT
guess a casing for it. Its arguments are formatted like those of any other instruction.

Examples: `cases/casing/unknown-keywords`.

## 7. Blank lines

### 7.1 Structural blank lines

These rules apply whatever `trim_empty_lines` is set to. A blank line MUST be present:

1. Above every block opener and every label, unless the preceding node is itself a block opener,
   a comment, or (for a label) another label.
2. Below every block closer, unless the following node is another block closer or a block opener.

A blank line MUST NOT appear between consecutive labels: adjacent labels are aliases for one
jump target, and nothing may separate them, not even a blank line the author wrote.

A comment directly above a chunk opener belongs to it: the blank line goes above the comment,
not between the comment and what it documents.

Examples: `cases/blank-lines/structural`, `cases/blocks/sections`, `cases/labels/aliases`,
`cases/labels/spacing`.

### 7.2 Trimming

When `trim_empty_lines` is `true` (the default), leading and trailing blank lines are removed and
runs of consecutive blank lines are collapsed to one. When `false`, the author's blank lines are
kept as written, apart from the structural rules in §7.1.

Examples: `cases/blank-lines/trim`, `cases/blank-lines/preserved-single`,
`cases/blank-lines/kept-untrimmed`.

## 8. Arguments

Arguments are separated by exactly one space. Leading and trailing whitespace on a line is
removed, except for indentation.

Examples: `cases/arguments/spacing`.

### 8.1 Parameter casing

An argument whose lowercased spelling is listed for the instruction in the `instruction` map of
`tables/parameters.json` MUST be printed with that canonical spelling; otherwise, if it appears
in `global`, that spelling is used. An argument of the form `prefix=value` whose `prefix=` is
listed in `globalPrefixes` has its prefix canonicalised, and its value normalised per §6.3.

Instruction-scoped entries take precedence over global ones. Not every switch is uppercase:
`tables/parameters.json` records the spelling from the NSIS documentation, which is why
`RMDir /r` stays lowercase while `/REBOOTOK` does not.

Examples: `cases/parameters/global-switches`, `cases/parameters/instruction-scoped`.

### 8.2 Pipe-separated arguments

An unquoted argument containing `|` (such as a `MessageBox` flag list) is split on `|` and
rejoined without surrounding spaces, so `MB_OK | MB_ICONSTOP` becomes `MB_OK|MB_ICONSTOP`.
`${…}` groups are never split.

Examples: `cases/arguments/pipes`.

### 8.3 Arithmetic arguments

For `IntOp` and `IntPtrOp`, the arguments are tokenised into operands and operators
(`>>>`, `||`, `&&`, `<<`, `>>`, `+`, `-`, `*`, `/`, `%`, `|`, `&`, `^`, `~`, `!`) and rejoined
with single spaces. A `-` that follows another operator is a sign and stays attached to its
operand. `${…}` groups are never split.

Examples: `cases/arguments/arithmetic`.

## 9. Quotes

A quoted argument is reprinted with the preferred delimiter: `"` by default, `'` when
`single_quote` is `true`. The delimiter is chosen as follows:

1. If the content contains neither `"` nor `'`, the preferred delimiter is used.
2. Otherwise, if the content does not contain the preferred delimiter, it is used.
3. Otherwise, if the content does not contain the other quote character, that one is used.
4. Otherwise, if the content contains no backtick, `` ` `` is used.
5. Otherwise `"` is used and every `"` in the content is escaped as `$\"`.

Escaped quotes in the input (`$\"`, `$\'`, ``$\` ``) are unescaped before this choice is made, so
a string is re-escaped only where the chosen delimiter requires it. NSIS has no doubled-delimiter
escape: `"a""b"` is two arguments, not one string containing a quote.

Unquoted arguments MUST NOT gain quotes, and quoted arguments MUST NOT lose them.

Examples: `cases/quotes/normalize`, `cases/quotes/single-quote-option`.

## 10. Line width

When `print_width` is greater than 0 and a line would exceed it, the line is broken between
arguments: each fragment except the last ends with a space and a `\` continuation, and
continuation lines are indented one level deeper than the first line. The keyword always stays
on the first line, and an argument is never split internally, so a single long argument may
exceed `print_width`.

When `print_width` is `0`, no wrapping occurs and lines may be arbitrarily long.

A trailing comment stays attached to the last fragment.

Examples: `cases/wrapping/print-width`, `cases/wrapping/disabled`.

## 11. Comments

### 11.1 Placement

A comment on its own line is printed at the current indentation level. A trailing comment stays
on its line, separated from the code by one space. Exactly one space follows the comment marker.

Examples: `cases/comments/placement`.

### 11.2 Markers

When `comment_style` is unset, a single-line comment keeps the marker it was written with
(`;` or `#`). When it is `"hash"` or `"semi"`, every single-line comment uses `#` or `;`
respectively.

Block comments (`/* … */`) MUST NOT be rewritten: their marker is never changed, and their inner
lines keep their relative text, re-indented to the comment's level. An inner line is relative to
the whitespace before the opening `/*`, compared exactly, with no tab-width arithmetic: whatever
follows that whitespace is kept. An inner line that does not begin with it is placed at the
comment's level.

Examples: `cases/comments/block-indent`, `cases/comments/block-indent-uneven`,
`cases/comments/preserved-markers`,
`cases/comments/unified-hash`, `cases/comments/unified-semi`.

## 12. Labels

A label is printed at the current indentation level, immediately followed by `:`. Consecutive
labels stay adjacent (§7.1).

Examples: `cases/labels/aliases`, `cases/labels/spacing`.

---

## Appendix A: Command line behaviour (non-normative)

Implementations ship comparable command line tools, but none of this is required for conformance:

- A `format` command writes to standard output, or edits files in place with `--write`.
- A `check` command exits non-zero when a file is not formatted.
- `--eol` defaults to the platform convention (CRLF on Windows, LF elsewhere) rather than to the
  detection in §4, so command line output does not depend on the input's endings.

## Appendix B: Encoding (non-normative)

`format` operates on text, so decoding is the caller's concern. Implementations read UTF-8 and
strip a leading byte order mark during preprocessing (§2); the mark is therefore absent from the
output. NSIS also accepts UTF-16 sources, which implementations may or may not read.
