# Implementation Plan: Blind Agent Acceptance

**Branch**: `015-blind-agent-acceptance` | **Date**: 2026-05-21 |
**Spec**: [spec.md](spec.md)

## Summary

Define the acceptance protocol that proves Portolan's generic agent toolbox
without target-specific scaffolding. The protocol gives an agent only Portolan,
the target root, the output location, and the mapping request. Apache Bigtop is
the first realistic target, but not a custom script.

## Technical Context

**Language/Version**: Markdown protocol and templates; existing Go CLI for
verification.
**Primary Dependencies**: Existing `portolan map` artifact bundle.
**Storage**: Spec-local templates and review ledgers under `specs/015-.../`;
Portolan run artifacts in an explicit local output directory selected by the
operator.
**Testing**: Protocol inspection, local fixture preflight, baseline Go/JSON/diff
checks, and later manual or scripted blind runs.
**Target Platform**: Cursor + Composer 2.5 first, with the same protocol usable
from Claude, Codex, OpenCode, pi, and other agent harnesses.
**Constraints**: No hidden target-specific hints; no network or mutation during
default mapping; fixtures cannot be counted as a passed real target run.

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Protocol forbids network, mutation, and credentials during default target mapping. |
| Evidence state honesty | Pass | Transcript claims remain lower authority than Portolan artifacts, and unsupported report claims stay `unknown`, `cannot_verify`, or `not_assessed`. |
| Complement existing tools | Pass | Protocol evaluates the toolbox and records gaps; it does not build scanners. |
| SpecKit before implementation | Pass | Spec, plan, and tasks define the protocol before use. |
| Test-first behavior | Pass | The first deliverable is the test protocol and ledger template before broad detector work. |

## Scope

In scope:

- blind prompt contract;
- allowed and forbidden operator inputs;
- run evidence bundle template;
- status taxonomy: `passed`, `failed`, `degraded`, `not_assessed`;
- Bigtop run rules that require a real local checkout for real acceptance;
- non-Bigtop control target requirement;
- updates to the existing Bigtop smoke docs so fixtures are clearly preflight
  only.

Out of scope:

- cloning or preparing Apache Bigtop;
- implementing detector gaps found by the run;
- Bigtop-specific runbooks;
- MCP/LSP integration;
- automated benchmark harness.

## Design Decisions

| Decision | Rationale | Rejected Alternative | Reversibility |
| --- | --- | --- | --- |
| Use a blind prompt contract | Tests whether the product is self-discoverable. | Give agents a custom Bigtop packet. | High; protocol can be tightened after first runs. |
| Require a non-Bigtop control target | Reduces overfitting to Bigtop. | Treat one Bigtop run as enough. | High; target list can expand later. |
| Count fixtures as preflight only | Prevents mocks from replacing product evidence. | Let fixture smoke pass the operator gate. | High; fixtures remain useful for local command checks. |
| Keep run artifacts spec-local | Keeps acceptance evidence reviewable without polluting root docs. | Store ad hoc transcripts in chat only. | High; future automation can consume same template. |

## Project Structure

```text
docs/
  agent-toolbox/
    blind-acceptance.md
specs/
  015-blind-agent-acceptance/
    spec.md
    plan.md
    tasks.md
    templates/
      run-ledger.md
    reviews/
      .gitkeep
specs/
  007-apache-bigtop-corpus/
    acceptance-smoke.md
```

## Verification Plan

- Inspect the allowed prompt and confirm it contains no target-specific file
  list or Bigtop build choreography.
- Run `go test ./...`.
- Run `jq empty schema/*.json`.
- Run `git diff --check`.
- Run a local `portolan map` preflight against a fixture, but mark it as
  preflight only.
- After spec 014 is implemented, execute at least one blind agent run and record
  the evidence bundle under `specs/015-blind-agent-acceptance/reviews/`.

## Risks

- Manual blind runs can still leak hints through operator behavior. Mitigation:
  the protocol must preserve the exact prompt and list forbidden inputs.
- Bigtop checkout may be absent. Mitigation: record the run as blocked or
  `not_assessed`; do not replace it with a fixture pass.
- Different agents may not execute shell commands. Mitigation: status taxonomy
  includes `degraded`, with separate artifact-generation evidence.
