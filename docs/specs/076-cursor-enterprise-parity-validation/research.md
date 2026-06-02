# Research: Cursor Enterprise Parity Validation

## Decision: Gate Default Parity Execution On Spec 074 Runtime Evidence

Rationale: The parity rubric includes runtime topology. Spec 074 is the named
runtime-health capture slice, but its command sequence is still blocked pending
fresh explicit approval. Running default parity validation without that evidence
would restate a known gap and create pressure to overclaim.

Alternatives considered:

- Run anyway and score C4 as `not_assessed`: acceptable only as an explicitly
  approved current-evidence rejection run.
- Substitute Compose/Helm desired-state models for runtime: rejected because
  static deployment metadata is not runtime-visible topology proof.

## Decision: Treat Spec 077 As Current C6/Callgraph Boundary

Rationale: Spec 077 reviewed mature local graph producer options and found no
safe full resolved graph producer available locally. Ctags, gopls, jdeps, Maven,
and Java remain bounded adjacent evidence, not full graph/callgraph proof.

Alternatives considered:

- Use Ctags reference roles as full graph evidence: rejected by prior reviewed
  ledgers.
- Add a new graph adapter now: rejected because this slice is validation, not a
  new producer integration.

## Decision: Use A Fresh Artifact Root And Explicit Lane Isolation

Rationale: The prior consolidated stress report found an agent lane
contamination case where a no-Portolan lane read legacy Portolan output. The
next run must make contamination detectable rather than relying on prompt
intent alone.

Alternatives considered:

- Delete all prior `.portolan/stress` artifacts: rejected as unnecessary and
  potentially destructive. A timestamped output root and explicit forbidden
  paths are enough.
- Reuse the prior stress directory: rejected because it would blur old and new
  evidence.

## Decision: Keep Review Focus On Claim Promotion And Rejection

Rationale: 076 is not a code-feature slice unless execution reveals a concrete
Portolan defect. The main risk is claim drift: turning useful agent reports into
an unsupported human/enterprise parity claim.

Alternatives considered:

- Run code metrics such as CRAP or Maintainability Index: rejected as
  `not_applicable` for docs/stress artifacts unless code changes are introduced.
- Require GPT-family review lanes: rejected because Codex is GPT-family; repo
  rules require independent non-GPT evidence.
