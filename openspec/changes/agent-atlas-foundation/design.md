# Design — agent-atlas-foundation

## Decision

Portolan is two products on a shared Go deterministic core:

- **agent-atlas (base).** Local, read-only, **Node-free**. Go binary
  (`cmd/portolan`) collects (scan + index + staleness) and serves queries over a
  JSON snapshot. The coding agent consumes JSON / `portolan query` directly. No
  UI is required or loaded.
- **human-atlas (optional skin).** The JS reading layer (`portolan-core`)
  renders the same snapshot as `atlas.html`. Opt-in at install time. It is the
  sales/demo surface (C-level adoption) but architecturally a presentation layer
  over the agent base.

Language is assigned by **consumer fit**, not preference.

## Why Go for the collector (and why this is not "author preference")

The collector's job is: run OSS binaries (ripgrep, ctags, jscpd, syft, semgrep,
scip-*), parse their output, shard, walk filesystems, resolve symbols, serve
queries. Go is fit for exactly this (concurrency, `encoding/json`,
`path/filepath.WalkDir`, single static binary, static types, `go test`) and a
full Go collector **already exists** under `internal/` + `cmd/portolan`
(subcommands `scan`, `import`, `map`, `query`, `graph`, ...).

The decisive argument is **runtime economy on the agent path**, which is the
product's #1 install constraint (zero copied commands). Once the two consumers
are decoupled, the agent path carries no UI, so nothing forces Node onto it. A
Go binary plus single-purpose native tools (ripgrep, ctags) runs on a bare host.
Node is required only for the optional human skin (and for npm-packaged
producers like jscpd / scip-typescript, which are opt-in producers, not the
spine). Go's portability therefore earns its keep on the agent path precisely
because the UI is absent.

Alternatives considered:

- **JS collector.** Technically adequate (I/O + spawn + parse is not CPU-bound),
  and would keep a single runtime. Rejected because the agent path would then
  inherit a mandatory Node runtime, sacrificing Node-free portability — the one
  property that distinguishes the agent base. JS stays the optimal language for
  the *reading/presentation* layer, where it already lives with 454 tests.
- **Rust collector.** Fast and single-binary, but not in the repo; introducing a
  new toolchain violates "add dependencies only after documenting fit" for no
  gain over the existing Go core. Rejected.
- **Bash collector (status quo).** `portolan-scan.sh` (1391 lines, hundreds of
  `jq` calls) is collector logic in a glue language. It is the "what was lying
  around" case the foundation corrects. Bash remains only as thin drivers.

## Relationship to the standing "keep Go thin" rule

AGENTS.md currently says "Keep the legacy Go CLI thin; new product behavior
should usually live in harness scripts." This change **reverses** that rule for
collector behaviour: collector and index logic belongs in Go. The reversal is
justified because the Go core has matured into a full collector
(`internal/{scan,importer,relationships,graph,producerfamily,query,...}`); the
rule was written when that core was immature. Reading-layer behaviour continues
to follow the existing Clean-Architecture standards in `portolan-core`.

## Closing the initiation gap

Today `/portolan:map` (`portolan-map.mjs:130`) errors when no bundle exists,
diverging from `navigation` spec ("build the snapshot if stale"). Under the
foundation this gap dissolves by construction: collection is the agent-base's
default behaviour in Go (`portolan` collect → query → JSON), not a decision the
JS map makes. The JS `/portolan:map` becomes a render step over an already-built
snapshot, with a tree-signature staleness check that re-triggers Go collection
on source change. The conformance fix is an implementation slice layered on this
spec, not part of this spec-only change.

## Economical tentacles

The agent base is not a graph dump. It exposes a bounded, query-aware substrate:
symbol/reference/dependency/surface/finding queries return bounded relevant
results; a whole graph is opt-in. This respects the agent's context budget and
follows the aider repo-map precedent already cited in
`docs/research/2026-05-26-large-codebase-oss-landscape.md`.

## Reversibility

High. This is a spec/identity change plus a direction for where new code lands.
No code is deleted in this change. The Go core already exists; the JS reading
layer is untouched. If the agent-base/Go direction is later judged wrong, the
spec deltas are reverted and behaviour can move back into JS/bash without data
loss.

## Risk if wrong

Medium. The main risk is migrating `portolan-scan.sh` internals into Go
(out of scope here, but the direction enables it) — that is real engineering
work with sharding/coverage regression risk, scoped to follow-on changes. The
language-fit decision itself is low-risk: Go is already the collector's language
in practice; this change only makes the boundary explicit.

## Out of scope

- Migrating the 1391-line `portolan-scan.sh` sharding internals into Go
  (follow-on).
- The AST / symbol-reference producer (follow-on: `symbol-reference-edges`).
- The deep Bigtop landscape demo (follow-on: `bigtop-deep-landscape-demo`).
- The `/portolan:map` conformance fix itself (implementation slice).
