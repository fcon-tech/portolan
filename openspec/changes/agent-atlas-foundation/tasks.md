# Tasks — agent-atlas-foundation

This is a **spec-only** change: it lands the identity/language-fit foundation.
Implementation slices are follow-on changes.

## Spec artifacts

- [x] `proposal.md`
- [x] `design.md`
- [x] `specs/atlas-identity/spec.md` (ADDED: base/skin roles; economical
      tentacles; language fit)
- [x] `specs/engineering-standards/spec.md` (ADDED: portolan-core is reading
      layer not collector; collector wrappers delegate to Go)

## Validation

- [ ] `openspec validate --specs` passes with the new deltas.
- [ ] BDD runner still passes (no binding removed; this change adds no new
      executable scenario yet — bindings land with the implementation slices).

## Follow-on implementation slices (separate changes, listed for traceability)

- `agent-base-collect-query` (Go): `cmd/portolan` collect → query → JSON as the
  Node-free agent entry point; tree-signature staleness module; closes the
  `/portolan:map` initiation gap (conformance to `navigation` "build if stale").
- `migrate-scan-sh-to-go` (Go): migrate `portolan-scan.sh` collector internals
  (sharding, producer execution) into `internal/`; reduce the shell to a thin
  driver. Phased; touches one producer family at a time.
- `symbol-reference-edges` (Go + ontology delta): the AST reference-edge
  producer (agent-feature).
- `bigtop-deep-landscape-demo` (JS skin + navigation/reading-experience delta):
  render the full landscape (structural edges included) rather than a repo list.

## AGENTS.md update (part of applying this change)

- [x] Replace the "Keep the legacy Go CLI thin; new product behavior should
      usually live in harness scripts" engineering rule with the language-fit
      rule: collector in Go, reading in JS, bash as thin glue.
