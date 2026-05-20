# Skill Contract Correction: Current Reality, Target Contract, Gap Ledger

**Date**: 2026-05-20
**PR**: #8
**Mode**: IMPLEMENT

## Accepted Review Findings

| Severity | Finding | Disposition |
| --- | --- | --- |
| major | Artifact contract mixed future `portolan map` output with current reality. | accepted/fixed: `agent/AGENT_GUIDE.md` now separates `Current Reality`, `Target Contract`, and gap handling. |
| major | Skill pack lacked a backlog-ready gap ledger template. | accepted/fixed: guide and example now include a gap ledger with gap id, context, attempted task, command/artifact, observed limitation, expected capability, affected promise, evidence state, user impact, priority, likely spec, and status. |
| major | Report format was too generic and did not force product-promise coverage. | accepted/fixed: example report now covers relationships, duplication, configuration surfaces, technical debt, unknown/cannot_verify, and gaps with evidence reference, evidence state, confidence/status, and source type. |
| rejected | Generic skill should not hard-code Bigtop-specific choreography. | kept rejected: guide contains no Bigtop-specific route; concrete smoke steps belong in acceptance notes or logs. |
| rejected/minimal | Full decision tree is likely brittle. | accepted as minimal guardrails: guide uses short guardrails and input inventory rather than a branching decision tree. |

## Verification

| Check | Status |
| --- | --- |
| `go test ./...` | verified |
| `jq empty schema/*.json corpora/apache-bigtop/manifest.json` | verified |
| `git diff --check` | verified |
| `go run ./cmd/portolan --version` | verified |
| `go run ./cmd/portolan scan --help` | verified |
| `go run ./cmd/portolan packet render --help` | verified |
| `go run ./cmd/portolan import cyclonedx --help` | verified |
