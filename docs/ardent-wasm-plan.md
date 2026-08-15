# Ardent WASM Plan

Plan to end the ardent/dent dual-maintenance burden by compiling the ardent Rust crate to WebAssembly
and publishing it on npm as `@nsis/ardent`.

Paths below are relative to the repository they name: this repo (`nsis-org`), the sibling `ardent` repo,
the sibling `nsis-lsp` repo, and `nucleo-matcher-wasm`.

## Context

Ardent (Rust) and Dent (TypeScript, `packages/dent` on top of `@nsis/parser`) are maintained at full
feature parity. Every grammar fix, casing-table entry, and printer tweak is written twice, and ardent's
`tasks/compare.ts` exists purely to police the drift. That cost grows with the feature set.

The goal is to make ardent the single implementation and give JavaScript consumers a way to use it
in-process — including browser targets (`packages/dent-ui`, `beautifier-dent`, VS Code web extensions)
that a native prebuilt binary could not serve. Compiling the ardent crate to WebAssembly and publishing
it as `@nsis/ardent` does that with one CI job and no platform matrix.

**Scope of this plan:** the WASM build and npm package only. Migrating downstream consumers
(`nsis-bridge`, `vscode-nsis`, `packages/dent-ui`, `beautifier-dent`, `packages/dent-cli`) and formally
deprecating `@nsis/dent` / `@nsis/parser` is follow-up work, unblocked by this.

**Decisions already made:** publish under a new name `@nsis/ardent` (a final `@nsis/dent` release will
later re-export it with a deprecation notice); the wrapper lives in the ardent repo.

## Background

Facts that make this cheap:

- The ardent library (`src/lib.rs`) declares only `canonical_casing`, `canonical_includes`,
  `canonical_parameters`, `parser`, `printer`, `rules`. Its sole dependency is `peg`. No `std::fs`,
  `std::time`, or `std::env` anywhere in the library path.
- `clap`, `glob`, and `similar` are used exclusively by the binary — `similar` only from `src/diff.rs`,
  which is `mod diff;` inside `src/main.rs`, not part of the crate's public library.
- Ardent's public API (`Formatter::new` → `format` / `check`) is a near-exact mirror of dent's
  `createFormatter` in `packages/dent/src/dent.ts`, down to option names and the "return `null`/`None`
  when already formatted" contract.
- Ardent's `pnpm-workspace.yaml` already exists with `docs` and `tasks` members; `wasm-pack` is already
  installed locally.
- **`nsis-lsp` consumes `ardent = "0.10"` as a crate** (`nsis-lsp/src/settings.rs`), so the `Cargo.toml`
  changes must stay API- and profile-compatible for native consumers.

### Precedent to follow: `nucleo-matcher-wasm`

`nucleo-matcher-wasm` is an existing published Rust→WASM→npm package in the same ecosystem.
**Mirror its conventions rather than inventing new ones.** What to copy:

- `scripts/build.ts` (zx): builds twice into a temp `.build/` dir — `--target nodejs` and the default
  bundler target — then copies the artifacts into a flat `dist/` as `.cjs` / `.mjs` / `.d.ts` / `_bg.wasm`.
- `package.json` `exports` with `types` / `require` / `import` pointing at that flat `dist/`, plus a
  `sideEffects` array listing the two entry files and `"files": ["dist"]`.
- `tsify-next` + `serde-wasm-bindgen` to accept a real camelCase options object from JS **with generated
  TypeScript types**, instead of hand-writing a `.d.ts` or passing loose primitives.
- `vitest.config.ts` with `vite-plugin-wasm` and `pool: 'forks'`.
- `.github/workflows/publish.yml`: tag-triggered, caches the `wasm-pack` binary by `Cargo.lock` hash.

What **not** to copy: nucleo's `.cargo/config.toml` `+simd128` rustflags (no benefit to a PEG parser,
costs runtime compatibility) and its `panic = "abort"` release profile (see below).

## Implementation

All changes below are in the **ardent** repo unless stated otherwise.

### 1. `Cargo.toml`

```toml
[lib]
crate-type = ["cdylib", "rlib"]   # rlib keeps the bin, tests, and nsis-lsp working

[features]
wasm = ["dep:wasm-bindgen", "dep:serde", "dep:serde-wasm-bindgen", "dep:tsify-next"]

[dependencies]
peg = "0.8"
wasm-bindgen = { version = "0.2", optional = true }
serde = { version = "1", features = ["derive"], optional = true }
serde-wasm-bindgen = { version = "0.6", optional = true }
tsify-next = { version = "0.5", default-features = false, features = ["js"], optional = true }

[target.'cfg(not(target_arch = "wasm32"))'.dependencies]
clap = { version = "4", features = ["derive"] }
glob = "0.3"
similar = "3.1.1"

[package.metadata.wasm-pack.profile.release]
wasm-opt = ["-O4"]
```

Leave the existing `[profile.release]` (`lto = true`, `strip = true`) **unchanged** — it is shared with
the CLI binary, and nucleo's `panic = "abort"` would break `#[should_panic]` tests under `--release`.
Size tuning for WASM goes through the `wasm-pack` metadata block instead.

Note: after the target-gating, `cargo check --target wasm32-unknown-unknown --all-targets` fails on the
binary. Expected — `wasm-pack` builds `--lib` only.

### 2. `src/wasm.rs` — bindings

New module, declared in `lib.rs` as `#[cfg(feature = "wasm")] mod wasm;`. Following the nucleo pattern:

- A `#[derive(Tsify, Serialize, Deserialize, Default)] #[tsify(from_wasm_abi)] #[serde(rename_all = "camelCase")]`
  `WasmFormatterOptions` struct mirroring dent's `DentOptions` field-for-field (`endOfLine`, `indentSize`,
  `printWidth`, `singleQuote`, `trimEmptyLines`, `useTabs`), with `#[serde(default)]` values matching
  `FormatterOptions::default()`. `endOfLine` is a `#[serde(rename_all = "lowercase")]` enum (`crlf` | `lf`)
  converted to `EndOfLine` via a `From` impl, exactly as nucleo converts `CaseMatching`/`Normalization`.
- `#[wasm_bindgen] pub struct WasmFormatter(Formatter)` with:
  - `#[wasm_bindgen(constructor)] pub fn new(options: WasmFormatterOptions) -> Result<WasmFormatter, JsError>`
    — the existing `Formatter::new` validation (`indent_size == 0` with `use_tabs: false`) surfaces as a
    `JsError`.
  - `pub fn format(&self, input: &str) -> Result<String, JsError>`
  - `pub fn check(&self, input: &str) -> Result<Option<String>, JsError>` — `Option<String>` maps to
    `string | undefined`; the JS wrapper normalises to `null` to match dent.

All formatting logic stays in `lib.rs`; this module only translates types.

### 3. npm package (`npm/`, new pnpm workspace member)

Add `"npm"` to ardent's `pnpm-workspace.yaml`. Port `nucleo-matcher-wasm/scripts/build.ts` verbatim in
shape, substituting the crate name (`ardent_bg.wasm` etc.) and adding `--features wasm` to both
`wasm-pack` invocations:

```
wasm-pack build --no-pack --release --features wasm --target nodejs --out-dir .build/cjs
wasm-pack build --no-pack --release --features wasm             --out-dir .build/esm
```

A thin hand-written wrapper on top of the generated bindings provides the dent-compatible entry point.
The nodejs target loads synchronously; the bundler target needs `init()`. The public API is `async` in
both cases so the two entries are interchangeable:

```ts
export function createFormatter(options?: ArdentOptions): Promise<{
  format(input: string): string;
  check(input: string): string | null;   // null when already formatted
}>;
```

`ArdentOptions` is re-exported from the tsify-generated `.d.ts`, so the option types come from the Rust
source and cannot drift. `npm/package.json`: name `@nsis/ardent`, `"files": ["dist"]`, `exports` map and
`sideEffects` copied from nucleo, version mirroring the crate version.

### 4. Tasks and CI

- `mise.toml`: add `wasm:build` (runs the zx script) and `wasm:test`, matching the existing task style.
- `.github/workflows/ci.yml`: add a `wasm-pack` binary cache step (keyed on `Cargo.lock`, as in nucleo's
  workflows) plus `mise run wasm:build` and `mise run wasm:test`. Single ubuntu runner, no matrix.
- `.github/workflows/release.yml`: add a `publish-to-npm` job next to the existing `publish-to-crates`,
  gated on the same `v*` tag, modelled on `nucleo-matcher-wasm/.github/workflows/publish.yml`. Set the
  npm version from the tag so crate and package versions never diverge.

### 5. Parity test

`npm/test/format.test.ts` (vitest + `vite-plugin-wasm`, `pool: 'forks'`): load each fixture in ardent's
`tests/fixtures/`, format it through the WASM build, and assert the output equals the native CLI's output
for the same file. This proves the WASM path is byte-identical to the binary rather than merely "works",
and reuses fixtures instead of inventing new expectations.

## Verification

1. `wasm-pack build --release --features wasm` — this is the gate. If the `peg`-generated parser compiles
   for `wasm32-unknown-unknown`, everything downstream is mechanical. Run this **first**, before writing
   the wrapper or touching CI.
2. Record the resulting `.wasm` size (raw and gzipped, after `wasm-opt -O4`) — bundle size is the main
   cost of this approach, and the browser consumers are the ones who pay it.
3. `mise run checks` — confirms the dependency gating did not break the native build, the CLI, or the
   existing test suite.
4. `cargo publish --dry-run`, then build `nsis-lsp` against the local crate (`cargo build` with a path
   override) — verifies the `crate-type` and dependency changes don't break the existing Rust consumer.
5. `mise run wasm:test` — fixture parity between WASM and native output.
6. Smoke-test both entry points against the workspace build: `node -e "import('@nsis/ardent')..."` for the
   `.mjs`/`.cjs` paths, and a scratch Vite page for the bundler path, confirming the `exports` map resolves
   correctly in each runtime.

## Not in scope

Downstream migration (`nsis-bridge`, `vscode-nsis`, `beautifier-dent`, `packages/dent-cli`,
`packages/dent-ui`), swapping the ardent docs playground off dent (which would remove the "powered by
Dent, not Ardent" note in ardent's `docs/src/content/docs/playground.mdx`), and deprecating `@nsis/dent`
/ `@nsis/parser`.

## Alternatives considered

- **Status quo** — parity in two languages, policed by `compare.ts`. Highest recurring cost.
- **Freeze dent** — bugfix-only, no new features. Near-zero cost, but parity erodes over time.
- **Native prebuilt binaries** (napi-rs, or the per-platform npm packages `nsis-lsp` already ships under
  `packages/`). Fastest runtime, but a build matrix across six-plus targets and nothing for the browser,
  so `dent-ui` and web extensions would still need a second answer.
- **Sunset dent with no replacement** — cheapest, but breaks in-process formatting and kills the browser
  targets outright.

WASM was chosen because only it removes the parity burden while keeping every consumer, browser ones
included.
