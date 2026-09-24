# Implementing Dent style

Notes on what the known implementations agree on beyond the [specification](./SPEC.md). None of
this is required for conformance; it describes current practice, so tools built on either
implementation behave alike.

## Known implementations

| Implementation                                                       | Language   | Package      |
| -------------------------------------------------------------------- | ---------- | ------------ |
| [Dent](https://github.com/idleberg/nsis-org/tree/main/packages/dent) | TypeScript | `@nsis/dent` |
| [Ardent](https://github.com/idleberg/ardent)                         | Rust       | `ardent`     |

## Command line behaviour

- A `format` command writes to standard output, or edits files in place with `--write`.
- A `check` command exits non-zero when a file is not formatted.
- `--eol` defaults to the platform convention (CRLF on Windows, LF elsewhere) rather than to the
  detection in SPEC.md §4, so command line output does not depend on the input's endings.

## Options

Both implementations reject option values outside `schemas/options.schema.json`, such as a
negative `print_width` or an unknown `comment_style`, rather than guessing what was meant.

## Encoding

`format` operates on text, so decoding is the caller's concern. Implementations read UTF-8 and
strip a leading byte order mark during preprocessing (SPEC.md §2); the mark is therefore absent
from the output of `format`. makensis reads the mark to pick a file's encoding, so a tool that
writes formatted output back to a file restores the mark when the file had one, and a file whose
only difference is the mark counts as formatted. NSIS also accepts UTF-16 sources, which
implementations may or may not read.
