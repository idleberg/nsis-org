# Ardent WASM Plan

Plan to end the ardent/dent dual-maintenance burden by compiling the ardent Rust crate to WebAssembly
and publishing it on npm as `@nsis/ardent`. Where the build lives is recorded in
[ADR 0002](adr/0002-ardent-wasm-lives-in-nsis-org.md).

## Context

Ardent (Rust) and Dent (TypeScript, `packages/dent` on top of `@nsis/parser`) both implement the Dent Style
Specification. Every grammar fix and printer change is still written twice, once per implementation.

The goal is to make Ardent the single implementation and give JavaScript consumers a way to use it
in-process, including browser targets (`packages/dent-ui`, `beautifier-dent`, VS Code web extensions)
that a native prebuilt binary could not serve. A WebAssembly build does that with one CI job and no
platform matrix.

## Status

**Step one is done:** `packages/ardent` builds, passes the specification's conformance cases in
Node.js, and loads in a browser. Nothing uses it yet.

## Design

- **Crate:** `packages/ardent/Cargo.toml` depends on `ardent = "=0.17.0"` from crates.io. The ardent
  repository is unchanged; its library compiles for `wasm32-unknown-unknown` as published.
  `src/lib.rs` only translates types: a camelCase `ArdentOptions` struct (tsify, so the TypeScript
  types come from Rust) and a `Formatter` class with `format` and `check`. Options are deserialised by
  hand so serde's error message reaches JavaScript.
- **Size over speed:** `opt-level = "s"`, LTO, one codegen unit, `panic = "abort"`, `wasm-opt -Os`, no
  SIMD. The module is about 205 kB, or about 85 kB gzipped.
- **One build, two entries:** `wasm-pack --target web` runs once. The `node` export condition
  instantiates the module synchronously from disk, and the `default` condition fetches it with
  top-level `await`. The URL is relative to the module, so bundlers need no wasm plugin. The package is
  ESM only.
- **API:** `createFormatter(options?) → { format, check }`, synchronous, with `check` returning `null`
  for already formatted input, the same shape as `@nsis/dent`. Option and parse errors are plain
  `Error`s. The specification leaves error wording unspecified, so Dent's `TypeError`/`RangeError`
  validator is not duplicated.
- **Tests:** the specification's conformance cases run in Node.js. They come from the registry
  version of `@nsis/dent-spec` that the bundled Ardent conforms to (currently `0.1.0`), not
  `workspace:*`. A browser-mode smoke test covers the `default` entry. The case runner is a copy of
  `packages/dent/tests/conformance.test.ts`.
- **Tooling:** `mise.toml` installs Rust with the wasm target and `wasm-pack`, so contributors and CI
  get both through `mise install`. turbo builds the package like any other; `lint:rust` runs
  `cargo fmt --check` and clippy, locally through `pnpm lint` and in CI.
- **Releases:** changesets with the package's own semver. Bumping `ardent` (and `@nsis/dent-spec` with
  it) needs a changeset, at least minor when the output changes.

## Follow-ups

- Switch consumers from `@nsis/dent` to `@nsis/ardent`: `packages/dent-ui`, `packages/dent-cli`,
  `nsis-bridge`, `vscode-nsis`, `beautifier-dent`, and the ardent docs playground (which would remove the
  "powered by Dent, not Ardent" note in ardent's `web/src/content/docs/playground.mdx`).
- Deprecate `@nsis/dent` and `@nsis/parser`, with a final `@nsis/dent` release that re-exports
  `@nsis/ardent` and a deprecation notice.
- Move the conformance case runner (case discovery and the `options.toml` reader) into
  `@nsis/dent-spec`, so Dent and `@nsis/ardent` stop keeping copies.

## Alternatives considered

- **Status quo:** two implementations of one specification. Highest recurring cost.
- **Freeze dent:** bugfix-only, no new features. Near-zero cost, but Dent falls behind the
  specification.
- **Native prebuilt binaries** (napi-rs, or per-platform npm packages as `nsis-lsp` ships). Fastest
  runtime, but needs a build matrix across six or more targets and offers nothing for the browser.
- **Sunset dent with no replacement:** cheapest, but breaks in-process formatting and kills the browser
  targets outright.

WASM was chosen because only it removes the duplicate work while keeping every consumer, browser ones
included.
