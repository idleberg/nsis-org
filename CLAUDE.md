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

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
