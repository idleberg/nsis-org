# @nsis/dent-spec

> The Dent Style Specification: formatting rules, data tables and conformance cases for NSIS formatters

Dent style is an opinionated formatting style for [NSIS](https://nsis.sourceforge.io/) scripts.
This package defines it, so that every implementation formats identically.

**"Dent" is the name of the style, not of one tool.** [`@nsis/dent`](../dent) (TypeScript) and
[`ardent`](https://github.com/idleberg/ardent) (Rust) both implement it, and both are checked
against this package. Where an implementation and this specification disagree, the
implementation is wrong.

## Contents

| Path | What it is |
| --- | --- |
| [`SPEC.md`](./SPEC.md) | The specification: normative prose, rule by rule |
| `tables/*.json` | The data the rules refer to — casing, includes, parameters, variables, block roles |
| `cases/<area>/<name>/` | Conformance cases: `input.nsi`, `output.nsi` (or an `error` marker), optional `options.toml` |
| `schemas/*.schema.json` | JSON Schema for the tables and for `options.toml` |

## Using it

An implementation runs every case and compares bytes:

```js
import { readFile } from 'node:fs/promises';

const input = await readFile('cases/blocks/switch-case/input.nsi', 'utf-8');
const expected = await readFile('cases/blocks/switch-case/output.nsi', 'utf-8');

// Defaults apply when a case has no options.toml
expect(format(input)).toBe(expected);
```

Implementations also generate their lookup tables from `tables/`, rather than keeping their own
copy — that is what keeps them from drifting apart.

## Schemas

The schemas are published at
`https://idleberg.github.io/nsis-org/dent-spec/schemas/v1/<name>.schema.json`, so editors can
validate the data files and any `options.toml` directly. They are generated from the Valibot
schemas in `src/schemas.ts`; the emitted JSON Schema is the normative artifact.

```shell
npm run build:schemas           # regenerate schemas/
npm run build:schemas -- --check  # fail if the committed output is stale
npm test                        # validate tables, cases and SPEC.md citations
```

## Versioning

Semantic versioning, read for a formatter:

- **MAJOR** — an option default changes, an option is removed, or a rule is deliberately reversed.
- **MINOR** — new rules, new table entries, output-affecting fixes.
- **PATCH** — editorial only.

Output can therefore change in a MINOR release. Pin an exact version if you need byte-stable
output.

## License

MIT
