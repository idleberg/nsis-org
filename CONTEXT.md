# NSIS Tooling

JavaScript and TypeScript tooling for [NSIS](https://nsis.sourceforge.io/): syntax definitions for
editors and highlighters, a parser, and a formatter. Several packages describe the same language, so
the words below are used in one sense throughout.

## Language

### The language itself

**Vocabulary**:
The set of words NSIS has — instructions, compiler commands, block keywords, property values. Lives
in `data/language.jsonc` and answers "does this word exist?", never "how should it be written?".
_Avoid_: Keywords (too narrow), dictionary

**Instruction**:
A word that does something in a script, such as `DetailPrint` or `WriteRegStr`.
_Avoid_: Command (reserved for the compiler kind), function

**Compiler command**:
A word starting with `!` that the compiler acts on while building, such as `!define` or `!include`.
Lowercase by convention.
_Avoid_: Preprocessor directive, macro

**Include macro**:
A macro from an NSIS bundled include library, written with its delimiters, such as `${If}` from
`LogicLib.nsh`. Distinct from a user-defined macro declared with `!macro`.
_Avoid_: LogicLib keyword, helper

**Built-in name**:
A variable (`$INSTDIR`), define (`${NSISDIR}`) or language string (`$(^Name)`) that NSIS itself
provides. Built-in names cannot be shadowed by a script, which is why their casing can be rewritten
safely.
_Avoid_: System variable, magic constant

### Formatting

**Dent style**:
The formatting style this organization defines for NSIS scripts: casing, indentation, blank lines,
quoting and wrapping. The style is named Dent; it is not owned by any one tool.
_Avoid_: Dent formatting (ambiguous with the package), the Dent format

**Dent Style Specification**:
The document, data tables and conformance cases that define Dent style, published as
`@nsis/dent-spec`. It is the authority: where an implementation and the specification disagree, the
implementation is wrong.
_Avoid_: The spec (in prose where `@nsis/parser`'s grammar could be meant), the standard

**Implementation**:
A tool that formats NSIS scripts in Dent style. There are two: `@nsis/dent` (TypeScript) and
[Ardent](https://github.com/idleberg/ardent) (Rust).
_Avoid_: Formatter (ambiguous between the tool and the style), port, clone

**Conformance**:
The property of producing exactly the output every case of a given specification version requires.
An implementation conforms to a version, not "to Dent style" in general.
_Avoid_: Compatibility, parity (see below)

**Conformance case**:
One directory of input bytes, expected output bytes and optional options that an implementation must
reproduce exactly.
_Avoid_: Test, fixture (a fixture is only an input; a case carries its expectation)

**Table**:
A machine-readable style decision in the specification, such as which canonical spelling a keyword
has or which role it plays in a block. Tables are data; implementations generate their lookups from
them rather than keeping their own copy.
_Avoid_: Dictionary, map, list

**Divergence**:
A case where the two implementations produce different output. A divergence is a defect in at least
one of them, never an acceptable difference.
_Avoid_: Drift (the process, not an instance), incompatibility

**Parity**:
The state of having no divergences. Parity is the goal that the specification exists to make
checkable; it is not itself a mechanism.
_Avoid_: Equivalence, compatibility
