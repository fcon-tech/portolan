# Implementation Plan: Agent Bootstrap Discovery

**Branch**: `014-agent-bootstrap-discovery` | **Date**: 2026-05-21 |
**Spec**: [spec.md](spec.md)

## Summary

Make Portolan discoverable as a generic agent toolbox. A user should be able to
point an agent at the Portolan repository or binary and a separate target root;
the agent must find the entrypoint, run the map workflow, read artifacts, and
report gaps without target-specific prompts.

## Technical Context

**Language/Version**: Go CLI, Markdown documentation, agent skill files.
**Primary Dependencies**: Existing Go standard library and repository docs.
**Storage**: Local Portolan checkout, local target root, explicit local run
directory.
**Testing**: `go test ./...`; `jq empty schema/*.json`; `git diff --check`;
doc/link inspection; content checks that portable agent instructions do not
contain target-specific Bigtop choreography.
**Target Platform**: Local macOS/Linux CLI first; harness-independent agent
instructions.
**Constraints**: No network, no daemon, no target mutation, no credentials, no
target-specific acceptance packet inside the generic product surface.

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | The bootstrap contract keeps target reads local and writes only to the selected run directory. |
| Evidence state honesty | Pass | The report contract preserves `unknown`, `cannot_verify`, and `not_assessed`. |
| Complement existing tools | Pass | This slice packages the existing CLI and agent workflow; it does not introduce scanners or integrations. |
| SpecKit before implementation | Pass | This spec, plan, and tasks define the implementation before edits. |
| Test-first behavior | Pass | Verification includes local commands and documentation checks; no behavior change starts without task coverage. |

## Scope

In scope:

- root-discoverable agent entrypoint;
- portable skill or equivalent reusable instruction artifact;
- wrapper delegation cleanup for Cursor;
- generic report and gap-ledger contract;
- guidance for non-source targets such as build/package/config/test repos;
- verification that generic instructions do not encode Bigtop-specific
  choreography.

Out of scope:

- MCP server;
- LSP/index service;
- Bigtop-specific runbook;
- detector implementation for duplication, configuration, or technical debt;
- network-based corpus preparation.

## Design Decisions

| Decision | Rationale | Rejected Alternative | Reversibility |
| --- | --- | --- | --- |
| Use root-discoverable docs before adding protocol surfaces | Fastest way to close the actual user gap without new runtime complexity. | Build MCP/LSP first. | High; later surfaces can delegate to the same entrypoint. |
| Add a portable skill artifact | Matches the current cheap test strategy and keeps Cursor from being the product boundary. | Only keep a prose guide. | High; skill can be reshaped for specific harness packaging later. |
| Keep Bigtop out of generic instructions | Prevents the acceptance corpus from becoming hidden product behavior. | Add a Bigtop operator packet. | High; target-specific protocols can live in acceptance logs, not product docs. |
| Treat non-source targets as first-class | Bigtop-style build/package/config repos are common and should not force fake source analysis. | Assume every target is an app source repo. | Medium; report categories may expand after detector work. |

## Project Structure

```text
README.md
agent/
  START_HERE.md
  AGENT_GUIDE.md
  skills/
    portolan-map/
      SKILL.md
  examples/
    map-report.md
.cursor/
  rules/
    portolan-map.mdc
docs/
  agent-toolbox/
    README.md
```

## Verification Plan

- Run `go test ./...`.
- Run `jq empty schema/*.json`.
- Run `git diff --check`.
- Inspect root navigation and verify a reviewer can find the agent entrypoint
  from `README.md`.
- Verify Cursor wrapper delegates to the portable entrypoint.
- Verify generic agent entrypoint and portable skill avoid Bigtop-specific
  instructions.
- Run `go run ./cmd/portolan map --help` and a local fixture map command after
  any CLI/help edits.

## Risks

- A docs-only implementation may still be too implicit for weak agents.
  Mitigation: the blind acceptance protocol in spec 015 must test this without
  handholding.
- Different agent harnesses use incompatible skill formats. Mitigation: keep a
  plain Markdown entrypoint authoritative and make skill packaging a wrapper.
- The root README can become noisy. Mitigation: keep the visible entrypoint
  short and delegate detail to the portable guide.
