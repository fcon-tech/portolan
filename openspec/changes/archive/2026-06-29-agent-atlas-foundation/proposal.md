## Why

Portolan is two products bundled into one, and the bundling has been load-bearing
in the wrong places. The coding agent consumes a **data + query substrate** to
navigate and edit; it needs no UI. The admiral/CTO consumes a **rendered atlas**
to read the landscape at a strategic level; for that, coarse evidence plus an
agent-produced narrative suffices, and a precise structural index is not
required. Today these two consumers share a single entry point
(`/portolan:map`) and a single implementation language story, which produces two
concrete failures:

1. **Initiation gap.** `/portolan:map` (`portolan-core/scripts/portolan-map.mjs`)
   cannot collect a snapshot — it errors out when no bundle exists
   (`portolan-map.mjs:130`) despite `openspec/specs/navigation/spec.md:16`
   already mandating "build the snapshot if stale." The JS reading layer was
   asked to be the entry point but cannot run the deterministic producers.
2. **Language drift.** Collector logic (run OSS scanners, parse JSON, shard,
   walk filesystems) sits in a 1391-line bash script (`scripts/portolan-scan.sh`)
   plus a JS reading layer, while a full Go collector already exists under
   `internal/` + `cmd/portolan` (subcommands `scan`, `import`, `map`, `query`,
   ...). Bash-with-jq is collector logic in the wrong language; the standing
   AGENTS.md rule "keep the Go CLI thin" blocks the natural home.

This change establishes the product as **agent-atlas (base) + human-atlas
(optional skin)** on a shared Go deterministic core, and assigns language by
consumer fit, not author preference.

## What Changes

- **Establish** the agent-atlas as the foundation: a local, read-only,
  Node-free data + query substrate the coding agent consumes directly
  (JSON bundle + `portolan query`). The human-atlas becomes an **optional,
  install-time presentation skin** (the JS reading layer, `atlas.html`) over the
  same snapshot.
- **Assign language by consumer fit.** The deterministic collector and query
  substrate SHALL be Go (`internal/`, `cmd/portolan`) and SHALL run Node-free on
  the agent path. The human-atlas presentation SHALL remain the JS reading layer
  (`portolan-core`). Shell scripts SHALL be thin drivers only.
- **Reverse** the standing AGENTS.md rule "keep the legacy Go CLI thin; new
  product behavior should usually live in harness scripts." Collector and index
  behavior now belongs in the Go core; the rule is replaced by "collector in Go,
  reading in JS, bash as thin glue."
- **Require** the agent-atlas to be **economical**: query-aware and
  token-budgeted, returning bounded relevant results, never a whole-graph dump.
- **Close** the initiation gap by making collection the agent-base's default
  behaviour in Go (`portolan` collect → query → JSON), not a decision the JS map
  makes. The human `/portolan:map` becomes a render step over an already-built
  snapshot (with a tree-signature staleness check).

## Capabilities

### New Capabilities

- **Agent-atlas base.** A Node-free Go substrate: collect (scan + index + staleness)
  → query → JSON. The coding agent consumes it without any UI.
- **Optional human-atlas skin.** The JS reading layer becomes an install-time
  option that renders the snapshot; it is not required for the agent path.

### Modified Capabilities

- `atlas-identity`: adds the agent-base / human-skin role split, the economical-
  tentacles requirement, and the language-fit rule.
- `engineering-standards`: adds that `portolan-core` (JS) is the **reading**
  layer that consumes a Go-produced snapshot; collector behaviour SHALL live in
  the Go core and MUST NOT migrate into `portolan-core`. Refines the existing
  "bundle processing lives in Clean Architecture layers" and "thin drivers"
  requirements so reading wrappers delegate to JS use-cases and collector
  wrappers delegate to the Go core.

## Impact

- **Code**: `cmd/portolan` grows from thin into the real collector entry point;
  `internal/` gains the collect/query orchestration and a staleness
  (tree-signature) module. `portolan-scan.sh` shrinks toward a thin driver (its
  collector internals migrate to Go over time / when touched, out of scope for
  this change). `portolan-core` (JS) is unchanged as the reading layer and gains
  no collector logic.
- **Spec divergence fix**: `navigation` already mandates "build if stale"; this
  change makes the implementation conform by relocating collection to the Go
  agent-base (the conformance fix itself lands in a follow-on implementation
  slice, not in this spec-only change).
- **AGENTS.md**: the "keep Go thin" engineering rule is updated to the new
  language-fit rule.
- **Dependencies**: none added. Go is already in the repo; no new runtime is
  introduced for the agent path (Node remains required only for the optional
  human skin).
- **Out of scope**: migrating the existing 1391-line `portolan-scan.sh` sharding
  internals into Go; the AST/symbol-reference producer; the deep Bigtop demo.
  Each is its own follow-on change layered on this foundation.
