# Feature Specification: Cursor Enterprise Parity Validation

**Feature Branch**: `codex/076-cursor-enterprise-parity-validation`

**Created**: 2026-06-02

**Status**: Planning gate merged via PR #55; paired Cursor stress execution
remains blocked until spec 074 runtime-health evidence exists, unless the user
explicitly approves a current-evidence rejection run that keeps broad parity
`cannot_verify`. GitHub review approval remains `not_assessed`.

**Input**: The user objective asks whether Portolan plus Cursor understands
Bigtop architecture like a human or enterprise code intelligence system. Prior
rubrics kept this as `cannot_verify` because runtime topology, full
symbol/reference graph, call graph, and broad producer coverage were missing or
partial. Specs 075 and 077 now provide bounded producer coverage and a reviewed
graph/callgraph `cannot_verify` decision. Spec 074 remains approval-gated and
has no runtime-health output.

## User Stories

### US1 - Fair Paired Cursor Stress (Priority: P1)

As a Portolan evaluator, I can compare Cursor Composer 2.5 with and without
Portolan on the same Bigtop question set, using a fresh artifact root and
explicit stale-artifact exclusions, so that the comparison is not contaminated
by old runs or uneven prompts.

Independent test: both lane outputs exist, reference the same prompt version
and target root, and the lane ledger records whether Portolan artifacts were
allowed or forbidden.

### US2 - Evidence-Gated C1-C9 Scoring (Priority: P1)

As a reviewer, I can score each C1-C9 parity criterion as `verified`,
`partial`, `failed`, `cannot_verify`, or `not_assessed`, with every claim tied
to current Portolan/Bigtop evidence, so that agent prose is not upgraded into a
product claim.

Independent test: the scoring ledger contains one row per criterion, each row
names evidence inputs, blocker state, and whether a claim was promoted,
rejected, or left `cannot_verify`.

### US3 - Product Claim Closeout (Priority: P2)

As a Portolan maintainer, I can convert the scoring outcome into narrow product
claims, explicit gaps, and next evidence steps, so that Portolan remains a
navigation harness instead of pretending to replace enterprise code
intelligence.

Independent test: the closeout records allowed claims, disallowed broad parity
claims, review disposition, local verification, PR state, and merge readiness
without using unqualified "ready" language.

## Requirements

- **FR-001**: Reuse and update the existing C1-C9 architecture parity rubric.
- **FR-002**: Run paired Cursor-only and Cursor-plus-Portolan stress tests on
  the same Bigtop question set only after the execution gate is satisfied.
- **FR-003**: Include current evidence from specs 074, 075, and 077.
- **FR-004**: Treat spec 074 runtime-health output as `not_assessed` until the
  explicitly approved command sequence has run and produced ledgered evidence.
- **FR-005**: Treat spec 077's full symbol/reference graph and call graph
  outcome as `cannot_verify` unless a later approved producer slice upgrades it
  with mature local evidence.
- **FR-006**: Score each criterion independently as `verified`, `partial`,
  `failed`, `cannot_verify`, or `not_assessed`.
- **FR-007**: Require independent non-GPT review of every upgraded criterion
  and of any broad parity rejection closeout.
- **FR-008**: Forbid a broad "human/enterprise parity" claim unless every
  required criterion is verified or explicitly excluded with reviewed
  rationale.
- **FR-009**: Use a fresh `.portolan/stress/<timestamp>-076-*` artifact root
  and record any legacy artifact exclusions before running agent lanes.
- **FR-010**: Clean up transient non-`.portolan` stress artifacts created by
  the validation and record residue state as `verified`, `failed`,
  `not_assessed`, or `blocked`.
- **FR-011**: If spec 074 remains blocked, do not run the default parity stress;
  only a separately approved current-evidence run may be executed, and it must
  keep runtime topology and broad parity `cannot_verify`.

## Success Criteria

- **SC-001**: Paired Cursor stress outputs and scoring ledger exist for a
  gate-satisfied run, or the execution gate explicitly blocks the run.
- **SC-002**: Any promoted claim is backed by current runtime, producer, graph,
  or artifact evidence.
- **SC-003**: If any required criterion remains partial, `not_assessed`, or
  `cannot_verify`, the broad parity claim remains rejected and only narrower
  verified claims are allowed.
- **SC-004**: The final closeout separates local implementation,
  ready-for-review PR, ready-to-merge PR, and merged states.

## Dependencies

- Spec 074 runtime topology health capture: required for default C4/runtime
  validation; currently approval-gated and `not_assessed`.
- Spec 075 producer output coverage closure: merged bounded producer matrix.
- Spec 077 callgraph and symbol closure: merged reviewed `cannot_verify` for
  full symbol/reference graph and call graph.
- Prior Bigtop stress report:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163222/consolidated-report.md`.
