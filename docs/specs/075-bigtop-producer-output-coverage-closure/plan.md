# Implementation Plan: Bigtop Producer Output Coverage Closure

**Branch**: `codex/075-bigtop-producer-output-coverage-closure`

**Spec**: `docs/specs/075-bigtop-producer-output-coverage-closure/spec.md`

## Summary

Inventory and coverage-score the real Bigtop producer outputs accumulated in
specs 054-074 before Cursor enterprise parity is revisited. The slice is
evidence consolidation, not a claim upgrade by itself.

## Decision Gate

- **Simpler/Faster**: Jump directly to Cursor parity validation in spec 076.
  Rejected because prior Cursor syntheses repeatedly left C4, full C6, call
  graph, and C9 as `cannot_verify`; a current producer coverage matrix is the
  missing input for any honest parity rerun.
- **Blocking Edge Cases**: Producer families have mixed scopes and evidence
  states. Compose/Helm/protobuf/Semgrep/jdeps are real producer outputs but
  static or bounded. Ctags gives broad reference-role evidence but not resolved
  def/use or call graph. Runtime evidence is partial from spec 073 and
  approval-gated in spec 074. The matrix must not collapse partial evidence
  into full architecture proof.
- **Existing Open Source**: Reuse existing OSS producer outputs from Docker
  Compose, Helm, protoc, Semgrep, Universal Ctags, jdeps, jscpd, and gopls.
  Do not add a new scanner or Portolan parser in this slice.

## Scope

In scope:

- Producer output coverage matrix for specs 054-074.
- Evidence family classification and C1-C9 impact.
- Cursor stress against the matrix.
- Three independent non-GPT review lanes.

Out of scope:

- Runtime execution for spec 074.
- New target mutation or service startup.
- New producer installation.
- Portolan importer code.
- Cursor enterprise parity claim promotion; deferred to spec 076.

## Evidence Inputs

- `docs/specs/057-bigtop-producer-output-expansion/reviews/producer-run-ledger-2026-06-02.md`
- `docs/specs/063-bigtop-semgrep-local-producer/reviews/producer-ledger-2026-06-02.md`
- `docs/specs/066-bigtop-protobuf-api-descriptors/reviews/protobuf-descriptor-ledger-2026-06-02.md`
- `docs/specs/067-bigtop-compose-model-producer/reviews/compose-model-ledger-2026-06-02.md`
- `docs/specs/068-bigtop-helm-model-producer/reviews/helm-model-ledger-2026-06-02.md`
- `docs/specs/070-bigtop-ctags-import-references/reviews/ctags-import-reference-ledger-2026-06-02.md`
- `docs/specs/071-bigtop-ctags-cross-language-imports/reviews/ctags-cross-language-ledger-2026-06-02.md`
- `docs/specs/072-existing-artifact-jdeps/reviews/jdeps-existing-artifact-ledger-2026-06-02.md`
- `docs/specs/073-bigtop-runtime-capture-execution/reviews/runtime-capture-ledger-2026-06-02.md`
- `docs/specs/074-bigtop-runtime-topology-health-capture/reviews/pr52-merge-closeout-2026-06-02.md`

## Output Artifacts

- `reviews/requirements-product-vision-drift-2026-06-02.md`
- `reviews/producer-coverage-matrix-2026-06-02.md`
- `stress/cursor-producer-coverage-prompt-2026-06-02.md`
- `stress/cursor-producer-coverage-output-2026-06-02.md`
- `reviews/cursor-stress-ledger-2026-06-02.md`
- `reviews/review-disposition-2026-06-02.md`
- `reviews/pr-readiness-closeout-2026-06-02.md`

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
