# Implementation Plan: Cursor Enterprise Parity Validation

**Branch**: `codex/076-cursor-enterprise-parity-validation`

**Date**: 2026-06-02

**Spec**: `docs/specs/076-cursor-enterprise-parity-validation/spec.md`

## Summary

Turn the backlog-only parity idea into a gated validation slice. The default
execution path waits for spec 074 runtime-health evidence, then runs paired
Cursor Composer 2.5 lanes over the same Bigtop question set and scores C1-C9
against current evidence from specs 074, 075, and 077. If spec 074 remains
blocked, the only safe near-term action is a current-evidence rejection run
that explicitly preserves broad parity as `cannot_verify`.

## Decision Gate

- **Simpler/Faster**: Run Cursor-only versus Cursor-plus-Portolan immediately
  and record another comparison. Rejected for the default path because runtime
  topology is still `not_assessed` for spec 074 and full graph/callgraph is
  `cannot_verify` after spec 077. A run now may be useful only as an explicitly
  approved current-evidence rejection, not as parity proof.
- **Blocking Edge Cases**: Cursor lane contamination by old `run/` or
  `.portolan/stress` artifacts; unequal prompts; non-reproducible IDE output;
  stale evidence after new producer/runtimes specs; private path leakage in
  public excerpts; broad claim promotion from agent prose; missing GitHub or
  human approval; and spec 074's Docker/runtime mutation approval gate.
- **Existing Open Source**: No new scanner, adapter, or dependency is justified
  in this slice. Use current normalized Portolan artifacts and prior mature OSS
  outputs already ledgered in specs 075 and 077. Enterprise tools such as
  Sourcegraph, CAST, Backstage/Port, and observability platforms remain
  comparison references for the rubric, not runtime dependencies.

## Technical Context

**Language/Version**: Go for Portolan baseline verification; docs and stress
artifacts for this slice.

**Primary Dependencies**: Existing Portolan CLI, existing Bigtop local
landscape, Cursor Composer 2.5 manual lane outputs, `pi` review lanes.

**Storage**: Local files under `docs/specs/076-cursor-enterprise-parity-validation/`
and a fresh Bigtop `.portolan/stress/<timestamp>-076-*` output root.

**Testing**: `go test ./...`, `go vet ./...`, `jq empty schema/*.json`,
`git diff --check`, plus ledger integrity checks for generated stress JSON when
the stress run is executed.

**Target Platform**: Local Linux CLI environment.

**Project Type**: CLI/documentation/evidence validation slice; no source-code
behavior change is planned.

**Performance Goals**: Keep stress artifacts bounded and reproducible; avoid
full-root duplication or runtime-heavy commands unless explicitly approved.

**Constraints**: Local-first, read-only default; no network calls; no target
repo mutation; no Docker/runtime command without explicit approval; no broad
claim promotion without current evidence.

**Scale/Scope**: Apache Bigtop local landscape, Cursor Composer 2.5 paired
lanes, C1-C9 parity rubric.

## Constitution Check

- **Local-First And Read-Only By Default**: Pass for planning and docs. Runtime
  execution remains blocked by spec 074 approval; 076 itself must not start
  Docker or mutate target repositories.
- **Evidence State Honesty**: Pass. The plan preserves `not_assessed` for
  missing runtime evidence and `cannot_verify` for full graph/callgraph gaps.
- **Complement, Do Not Replace**: Pass. The slice compares Portolan-plus-agent
  behavior to enterprise/human expectations without claiming replacement.
- **SpecKit Before Implementation**: Pass after this branch creates concrete
  `plan.md`, `research.md`, `data-model.md`, `quickstart.md`, `tasks.md`, and
  a review gate.
- **Test-First For Behavior**: Not applicable to code behavior; baseline checks
  and artifact validation are required before PR readiness.

## Project Structure

### Documentation (this feature)

```text
docs/specs/076-cursor-enterprise-parity-validation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── reviews/
│   ├── requirements-product-vision-drift-2026-06-02.md
│   └── execution-gate-2026-06-02.md
├── stress/
│   ├── cursor-enterprise-parity-prompt-2026-06-02.md
│   ├── cursor-baseline-output-2026-06-02.md
│   └── cursor-with-portolan-output-2026-06-02.md
└── tasks.md
```

### Source Code

No Go source changes are planned. Any future source change discovered during
execution must first update this plan and tasks.

**Structure Decision**: Use spec-local planning, stress, and review artifacts.
No new `internal/...` package or CLI command is justified.

## Evidence Inputs

- Prior stress report:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163222/consolidated-report.md`.
- Spec 074 approval packet and current approval state:
  `docs/specs/074-bigtop-runtime-topology-health-capture/runbook.md` and
  `docs/specs/074-bigtop-runtime-topology-health-capture/reviews/approval-state-2026-06-02.md`.
- Spec 075 producer matrix and merge closeout:
  `docs/specs/075-bigtop-producer-output-coverage-closure/reviews/producer-coverage-matrix-2026-06-02.md` and
  `docs/specs/075-bigtop-producer-output-coverage-closure/reviews/merge-closeout-2026-06-02.md`.
- Spec 077 graph decision and merge closeout:
  `docs/specs/077-bigtop-callgraph-symbol-closure/reviews/graph-producer-decision-record-2026-06-02.md` and
  `docs/specs/077-bigtop-callgraph-symbol-closure/reviews/merge-closeout-2026-06-02.md`.

## Validation Workflow

1. Reconstruct current evidence state from specs 074, 075, and 077.
2. If spec 074 runtime-health evidence is absent, stop default parity
   execution and record the gate as blocked.
3. If the user explicitly approves a current-evidence rejection run, freeze the
   prompt and score C4/runtime and C6/callgraph as blocked or `cannot_verify`.
4. If spec 074 evidence exists, create a fresh Bigtop stress output root under
   `.portolan/stress/<timestamp>-076-cursor-enterprise-parity/`.
5. Verify no comparison lane reads forbidden legacy `run/` or stale
   `.portolan/stress` artifacts.
6. Generate or refresh Portolan context/map artifacts for the with-Portolan lane
   using current `main`.
7. Run Cursor Composer 2.5 baseline and with-Portolan lanes against the same
   prompt.
8. Score C1-C9 with evidence references and blocker states.
9. Run three assessed independent non-GPT review lanes plus local review for
   claim upgrades or broad parity rejection.
10. Record PR readiness closeout without using unqualified ready language.

## Output Artifacts

The `2026-06-02` suffixes below identify this planning branch. If execution
happens later, use the actual run date or run id and record the mapping in the
lane and scoring ledgers.

- `reviews/requirements-product-vision-drift-2026-06-02.md`
- `reviews/execution-gate-2026-06-02.md`
- `reviews/analyze-disposition-2026-06-02.md`
- `reviews/planning-review-disposition-2026-06-02.md`
- `stress/cursor-enterprise-parity-prompt-2026-06-02.md`
- `stress/cursor-baseline-output-2026-06-02.md`
- `stress/cursor-with-portolan-output-2026-06-02.md`
- `reviews/parity-scoring-ledger-2026-06-02.md`
- `reviews/review-disposition-2026-06-02.md`
- `reviews/pr-readiness-closeout-2026-06-02.md`
- `reviews/merge-closeout-2026-06-02.md`

## Verification

```bash
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

For executed stress runs, additionally validate any generated JSON artifacts
with `jq empty` and record the exact Cursor lane artifact paths. For
planning-only closure, no Cursor or Docker command is required.
