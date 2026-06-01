# Pre-Implementation Review Disposition: Blind Agent Acceptance

Date: 2026-05-21

## Scope Reviewed

- `docs/product-backlog.md`
- `docs/specs/015-blind-agent-acceptance/spec.md`
- `docs/specs/015-blind-agent-acceptance/plan.md`
- `docs/specs/015-blind-agent-acceptance/tasks.md`
- `docs/agent-toolbox/README.md`
- `docs/specs/007-apache-bigtop-corpus/acceptance-smoke.md`
- `docs/test-corpora/apache-bigtop.md`
- `docs/specs/007-apache-bigtop-corpus/spec.md`
- `docs/specs/007-apache-bigtop-corpus/tasks.md`

## Decision Gate

- Simpler/Faster: Implement this slice as a Markdown protocol, run-ledger
  template, Bigtop smoke correction, local fixture preflight, and status
  consolidation. No new Go code, dependency, or benchmark harness is needed.
- Blocking Edge Cases: Real blind acceptance depends on an external agent
  harness and a real local target checkout. A fixture preflight can verify the
  current command path, but it cannot prove Bigtop or operator acceptance.
- Existing Open Source: Existing benchmark frameworks would add process before
  the first evidence bundle exists. The current `portolan map` artifact
  contract plus a committed ledger template is enough for this slice.

## Findings

### major: Acceptance evidence needs a stable protocol outside chat

The spec requires an allowed blind prompt, forbidden hints, required artifacts,
status taxonomy, and review procedure, but no committed protocol file exists
yet.

Disposition: accepted; add `docs/agent-toolbox/blind-acceptance.md`.

### major: Run evidence needs a reusable spec-local ledger

The tasks require prompt, target, commands, artifacts, report, gap ledger,
status, and stop reason to be recorded, but there is no reusable template.

Disposition: accepted; add
`docs/specs/015-blind-agent-acceptance/templates/run-ledger.md` and keep run evidence
under `docs/specs/015-blind-agent-acceptance/reviews/`.

### major: Real blind runs cannot be substituted by fixtures

The Bigtop fixture can preflight current commands, but counting it as a passed
operator lane would violate evidence-state honesty and the spec's Bigtop rules.

Disposition: accepted; keep fixture runs preflight-only and record real Bigtop
and Cursor/Composer runs as `not_assessed` when absent.

### minor: Control target must be defined without overclaiming

The spec requires a non-Bigtop control target. The existing
`internal/testfixtures/map-command/repo` fixture is suitable for command preflight, but a
later real operator control should use a separate local project.

Disposition: accepted; document the fixture as default preflight control and
state that it does not prove blind operator acceptance.

## Review Evidence State

- verified: local inspection of the reviewed specs and docs.
- not_assessed: external model lanes before implementation.
- not_assessed: Cursor + Composer blind run before the protocol exists.
- not_assessed: real Bigtop checkout availability.
