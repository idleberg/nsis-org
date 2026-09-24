---
'@nsis/dent': minor
---

Generate the lookup tables from `@nsis/dent-spec` and run its conformance cases, so Dent and
Ardent can no longer drift apart.

Two behavioural changes come out of this:

- `$(^ComponentsSubText2_NoInstTypes)` and `$(^UnComponentsSubText2_NoInstTypes)` are now
  recased like every other built-in language string. They were missing from the table.
- End-of-line detection follows §4 of the specification: with `endOfLine` unset, the output is
  LF only when the input contains an LF and no CRLF. Previously the most frequent ending won, so
  a mostly-LF file with a stray CRLF was written as LF and is now written as CRLF. Set
  `endOfLine` explicitly to opt out of detection entirely.

The `detect-newline` dependency is gone as a result.
