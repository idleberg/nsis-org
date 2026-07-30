# CLAUDE.md

## Overview

Monorepo of npm packages (`@nsis/*`) providing JavaScript/TypeScript tooling for NSIS (Nullsoft Scriptable Install System).

## Commands

```bash
pnpm build            # build all packages
pnpm test             # test all packages
pnpm lint             # lint all packages

# Single package
pnpm --filter @nsis/dent test
```

## Generated Code

Do not edit directly — edit the `.grammar` / `.pegjs` source files instead, then rebuild:

- `packages/codemirror/src/parser.ts` and `parser.terms.ts` — from `src/nsis.grammar` (lezer-generator)
- `packages/parser/src/grammar.js` and `grammar.d.ts` — from `src/grammar.pegjs` (peggy)

## Architecture

- **@nsis/codemirror** has its own Lezer grammar, independent from **@nsis/parser** (PEG-based).
- **@nsis/dent** is the indentation library; **dent-cli** and **dent-ui** (Svelte 5) wrap it.
- **@nsis/nlf** reads/writes NSIS Language Files; **nlf-cli** and **vite-plugin-nlf** wrap it.

## Conventions

- NodeJS and lefthook are managed by mise, see `mise.toml`. Run `mise install` to set up the toolchain, this also installs the git hooks.
- Conventional Commits enforced via commitlint + lefthook.
- Shared dependency versions use the `catalog:` protocol in `pnpm-workspace.yaml`.
- Imports always include the *actual* file extension (we use `allowImportingTsExtensions=true`).
- Browser code is tested in Vitest browser mode, do not use browser mocking libraries such as `jsdom` or `happy-dom`.

## Coding Styles

- Prefer human-readable notation, e.g. prefer `Boolean()` over `!!`, `includes()` over `indexOf() > 0` etc.
- Vertical whitespace is encouraged, e.g. around block statements or before returns.

## Testing

**Vitest** is the test runner. The environment depends on what is being tested:

- **Browser code** (Svelte components, anything that runs in Atom's renderer process): use Vitest's browser mode with the Playwright provider.
- **Non-browser code**: use the default NodeJS environment.

Test files should be placed next to a module, e.g. `module.text.ts` is on the same path as `module.ts`. E2E tests are placed in a dedicated `e2e` folder.

Always verify that tests actually work after writing them!

## NSIS

- Documentation for NSIS commands is available via `makensis -CMDHELP <command>`. Omit the command to get the full command reference.
