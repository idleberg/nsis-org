---
status: accepted
---

# The Dent Style Specification is the authority on Dent style

Dent style had two implementations, `@nsis/dent` and Ardent, kept in step only by differential
testing (`ardent/tasks/compare.ts`) with hand-duplicated lookup tables on both sides. That setup
could detect a divergence but never settle it: neither tool was the reference, so every difference
became an argument about which behaviour was intended. We therefore made `@nsis/dent-spec` the
authority — prose, machine-readable tables, and byte-exact conformance cases — and reduced both
tools to implementations of it. Rule changes land in the specification first, both tools generate
their tables from it, and where a tool disagrees with a case, the tool is wrong.

## Considered options

- **Make `@nsis/dent` the reference**, since Ardent began as a port of it. Rejected: it would have
  made the specification a description of one tool's current behaviour, with no authority of its
  own, and it points the wrong way given Ardent is expected to lead.
- **Keep differential testing only.** Rejected for the reason above: "whatever both tools produce"
  cannot resolve a disagreement, and it documents nothing for a third implementation or for users.
- **Publish the specification as its own repository.** Rejected: `nsis-org` is already the neutral
  home of the NSIS tooling and will outlive `@nsis/dent`, and living here lets the specification's
  CI check `data/language.jsonc` coverage directly instead of fetching it across repositories.

## Consequences

- The specification is published to npm as a data-only package. `@nsis/dent` depends on it through
  `workspace:*`, so a specification change cannot merge unless Dent still conforms in the same pull
  request, while Ardent upgrades through its own lockfile.
- Because output-affecting changes ship in MINOR releases (Prettier's policy, recorded in `SPEC.md`),
  `scripts/check-spec-changesets.ts` requires a `@nsis/dent` changeset at least as large as the
  specification's, so an output change can never reach users as a Dent patch.
- Baselining the specification on Ardent's behaviour meant adopting its end-of-line detection; Dent
  changed as a result, and its `detect-newline` dependency is gone.
- If Ardent later replaces Dent with a WebAssembly build (see `docs/ardent-wasm-plan.md`), the
  specification keeps its value as the documented contract and regression suite, and its cases
  become the natural parity target for the WebAssembly build.
