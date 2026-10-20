# @nsis/ardent-wasm

> An opinionated code formatter for NSIS scripts

![License](https://img.shields.io/npm/l/%40nsis%2Fardent-wasm?style=for-the-badge)
[![Version](https://img.shields.io/npm/v/@nsis/ardent-wasm?style=for-the-badge)](https://www.npmjs.org/package/@nsis/ardent-wasm)
[![Build](https://img.shields.io/github/actions/workflow/status/idleberg/nsis-org/ci.yml?style=for-the-badge)](https://github.com/idleberg/nsis-org/actions)

Formats NSIS scripts in Dent style, conforming to the [Dent Style Specification](../dent-spec#readme). This
package is [Ardent](https://github.com/idleberg/ardent), compiled to WebAssembly: it runs the same code as
the `ardent` binary and produces the same output.

## Installation

`npm install @nsis/ardent-wasm`

## Usage

```ts
import { createFormatter } from "@nsis/ardent-wasm";

const { format, check } = createFormatter(/* user options */);

format(`
	# Look ma, no indentation
	Name "Demo"
	Section
	Nop
	SectionEnd
`);

// Returns null when the script is already formatted
check(`Name "Demo"\n`);
```

The API matches [`@nsis/dent`](../dent#readme), so either can be swapped for the other.

### Options

| Option           | Type                  | Default   | Description                                                            |
| ---------------- | --------------------- | --------- | ---------------------------------------------------------------------- |
| `commentStyle`   | `"hash"` \| `"semi"`  | unchanged | Marker for single-line comments; block comments are never rewritten    |
| `endOfLine`      | `"crlf"` \| `"lf"`    | detected  | Line endings of the output                                             |
| `indentSize`     | `number`              | `2`       | Spaces per indent level, ignored when `useTabs` is `true`              |
| `printWidth`     | `number`              | `120`     | Line width before wrapping with continuations, `0` disables wrapping   |
| `singleQuote`    | `boolean`             | `false`   | Prefer single quotes                                                   |
| `trimEmptyLines` | `boolean`             | `true`    | Collapse consecutive blank lines and strip leading and trailing blanks |
| `useTabs`        | `boolean`             | `true`    | Indent with tabs                                                       |

### Errors

`createFormatter` throws an `Error` for an invalid option, and `format` and `check` throw an `Error` for a
script that cannot be parsed. Unlike `@nsis/dent`, option errors are not split into `TypeError` and
`RangeError`, and their messages differ. The specification only requires that an error is raised.

## Runtimes

The package loads its WebAssembly module itself, so there is no `init()` to call and no bundler to
configure.

- **Node.js** (the `node` export condition) reads the module from disk while importing.
- **Everything else** (browsers, bundlers) fetches it with top-level `await`, relative to the entry
  module. This requires ES2022 output, which is the default for Vite and current bundlers.

The module is about 205 kB, or about 85 kB gzipped.

## Versioning

The bundled Ardent release is pinned in [`Cargo.toml`](Cargo.toml) (currently `0.17.0`). This package has its own
version number. A release that bundles an Ardent version with different output is at least a minor release.

## Development

Building requires Rust with the `wasm32-unknown-unknown` target and `wasm-pack`; `mise install` sets up both.

```sh
pnpm --filter @nsis/ardent-wasm build
pnpm --filter @nsis/ardent-wasm test
```

The tests run the conformance cases of the specification version that the bundled Ardent release
conforms to. When you bump `ardent` in `Cargo.toml`, bump `@nsis/dent-spec` in `package.json` to match.

## License

Released under [The MIT License](LICENSE).
