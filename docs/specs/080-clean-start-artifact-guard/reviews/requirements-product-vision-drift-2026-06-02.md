# Requirements And Product-Vision Drift Review

Spec: `docs/specs/080-clean-start-artifact-guard/`

Date: 2026-06-02

## Decision Gate

- Simpler/Faster: Add explicit generated guidance and acceptance-lane rules.
  Do not add a cleanup command or stress harness.
- Blocking Edge Cases: Prior `.portolan/stress/*` outputs may be valuable
  evidence, so automatic deletion is unsafe. No-Portolan baseline lanes must
  forbid Portolan artifacts completely. With-Portolan lanes may use only the
  fresh output root unless a run ledger names prior evidence.
- Existing Open Source: No external library is needed; this is artifact-boundary
  guidance over existing Portolan outputs.

## Requirements Drift

verified:

- Backlog row and spec both scope the slice to clean-start artifact boundaries.
- The spec does not require Cursor Composer 2.5 execution or spec 074 runtime
  approval.
- The plan keeps implementation in `internal/contextprep` plus
  `docs/agent/ACCEPTANCE.md`.

not_assessed:

- Independent model review lanes have not run yet.
- GitHub PR state does not exist yet.

## Product-Vision Drift

verified:

- The slice preserves local-first/read-only defaults.
- The slice does not add network access, daemon behavior, credentials, target
  deletion, or a Portolan-owned scanner.
- Contaminated lanes remain invalid evidence rather than degraded success.

Risk if wrong:

- If the guidance is too weak, agents may still read stale artifacts. The next
  stress run should inspect lane attestations and treat violations as
  contaminated.

Confidence: high.
