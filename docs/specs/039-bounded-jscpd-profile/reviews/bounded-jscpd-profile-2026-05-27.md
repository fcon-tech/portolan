# Bounded jscpd Profile

Date: 2026-05-27

## Profile

Generated `oss-plan.json` now emits this bounded jscpd command shape:

```text
jscpd --reporters json --output <context>/tool-outputs \
  --max-size 100kb \
  --max-lines 1000 \
  --ignore **/.git/**,**/.portolan/**,**/node_modules/**,**/vendor/**,**/build/**,**/dist/**,**/target/**,**/generated/** \
  --noSymlinks \
  --gitignore \
  --silent \
  <target-root>
```

## Safety Properties

- Reads: selected local target root.
- Writes: selected context `tool-outputs/jscpd-report.json`.
- Network: not expected.
- Target mutation: false.
- User approval: required before running producer commands from `oss-plan.json`.
- Exit status: not forced; producer failures remain visible to the operator.

## Evidence State Rules

- Usable JSON output: `metadata-visible`.
- Missing output: `not_assessed` until the producer is run.
- Malformed output: `cannot_verify`.
- Failed or interrupted run: failed/blocker evidence, not verified evidence.
