# Hypothesis Follow-Up: OSS Execution Plan Gap Fix

Date: 2026-05-26

## Source Hypothesis

H5 blind Cursor Agent acceptance classified OSS assembly as insufficient when
`tool-registry.json` was empty. The missing product behavior was not just
candidate detection; Cursor needed a safe next step for producing/importing OSS
evidence.

## Follow-Up Implemented

`specs/025-oss-execution-plan/` adds `oss-plan.json` to context preparation.

The plan records:

- whether jscpd, Syft, and Semgrep producers are available locally;
- whether corresponding outputs are already present in `tool-registry.json`;
- safe command arguments that write under the selected context output
  directory;
- `not_assessed` states when tools or local configs are missing.

## Evidence Boundary

This closes only the planning half of `GAP-OSS-EMPTY`. Portolan still does not
run external OSS tools by default. Actual producer execution remains a
user-approved action outside the read-only context-preparation command.

## Remaining Product Gaps

- `GAP-HARNESS-GO`: installed binary or reliable execution path still pending.
- `GAP-REL-NONGO`: non-Go relationship detection still pending.
- `GAP-DUP-CFG-DEBT`: native duplication, configuration, and debt detectors
  still pending.
