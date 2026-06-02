# Implementation Plan: Bigtop Architecture Synthesis

**Branch**: `codex/069-bigtop-architecture-synthesis`

**Spec**: `docs/specs/069-bigtop-architecture-synthesis/spec.md`

## Summary

Run a post-producer-expansion synthesis stress that combines Cursor Composer
2.5 with Portolan's accumulated Bigtop evidence from specs 059-068 and scores
the result against the existing C1-C9 architecture parity rubric.

## Decision Gate

- **Simpler/Faster**: Declare that the producer expansion wave improved Bigtop
  understanding and move on. Rejected because the user objective asks for proof
  of architecture understanding, runtime topology, and real producer outputs,
  and prior specs explicitly forbid overclaiming.
- **Blocking Edge Cases**: Static producer outputs can improve role, API,
  deployment-model, and gap reasoning but cannot prove live runtime topology.
  Definition-only ctags output cannot prove a full symbol/reference or call
  graph. A bounded Cursor packet cannot prove enterprise parity if C4 and C6
  remain missing.
- **Existing Open Source**: Reuse the existing C1-C9 rubric and Cursor Agent
  `composer-2.5`; do not add a new benchmark framework, dependency, or custom
  scanner for this synthesis slice.

## Scope

In scope:

- Summarize specs 059-068 after PR #46.
- Run one Cursor plus Portolan synthesis stress.
- Record criterion scoring and claim boundary.
- Run three independent non-GPT review lanes.
- Update task/status/PR readiness artifacts.

Out of scope:

- Runtime provisioning.
- New producer acquisition.
- CLI or schema implementation changes.
- Public claim document updates.

## Evidence Inputs

- `docs/specs/056-bigtop-architecture-understanding/reviews/architecture-understanding-ledger-2026-06-02.md`
- `docs/specs/058-bigtop-runtime-symbol-parity-proof/reviews/parity-rubric-2026-06-02.md`
- `docs/specs/058-bigtop-runtime-symbol-parity-proof/reviews/parity-stress-ledger-2026-06-02.md`
- `docs/product-backlog.md` rows P6-059 through P6-068
- Spec-local closeouts and ledgers for 059-068

## Expected Output

- Cursor prompt:
  `docs/specs/069-bigtop-architecture-synthesis/stress/cursor-architecture-synthesis-prompt-2026-06-02.md`
- Cursor output:
  `docs/specs/069-bigtop-architecture-synthesis/stress/cursor-architecture-synthesis-output-2026-06-02.md`
- Synthesis ledger:
  `docs/specs/069-bigtop-architecture-synthesis/reviews/architecture-synthesis-ledger-2026-06-02.md`
- Review disposition:
  `docs/specs/069-bigtop-architecture-synthesis/reviews/review-disposition-2026-06-02.md`

## Evidence Boundary

Allowed after this slice if supported:

- A bounded claim that Cursor plus Portolan has materially better Bigtop
  architecture evidence discipline and gap attribution after specs 059-068.

Not allowed unless new evidence appears:

- Verified Bigtop runtime topology.
- Verified full Bigtop symbol/reference graph or call graph.
- Human or enterprise code-intelligence parity for the declared Bigtop scope.

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```
