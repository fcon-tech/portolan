# Implementation Plan: Bigtop Brownfield Preflight

**Branch**: `codex/087-bigtop-brownfield-preflight`

**Date**: 2026-06-09

**Spec**: `docs/specs/087-bigtop-brownfield-preflight/spec.md`

**Input**: Product reset from evidence-substrate expansion to one narrow
Brownfield Preflight job on Apache Bigtop.

## Summary

Add a local, read-only `portolan preflight` command that composes existing
context/map artifacts into a bounded Bigtop preflight bundle. The bundle tells
an operator and downstream coding agent what is locally visible, which
code-understanding tools are available or missing, which blind spots remain, and
which artifacts to read first. The slice does not install tools, run network
commands, mutate target repositories, register MCP servers, start daemons, or
claim complete architecture/runtime/call-graph coverage.

## Decision Gate

- **Simpler/Faster**: Reuse existing context preparation, map artifacts,
  `tool-registry.json`, `oss-plan.json`, `summary.json`, `graph-index.json`,
  `findings.jsonl`, and `gaps.jsonl` instead of adding a scanner, dashboard, or
  live tool runner.
- **Blocking Edge Cases**: Candidate tools may require network install, mutate
  targets, write global agent config, start daemons/watchers, expose private
  dependency coordinates, or produce stale outputs. The preflight records those
  as approval boundaries and gaps, not evidence.
- **Existing Open Source**: Portolan composes mature tools such as Syft,
  CycloneDX plugins, jscpd, Semgrep, ctags, jdeps, Graphify, Understand
  Anything, ast-index, Compose, and Helm. Portolan owns selection,
  normalization, approval boundaries, and handoff, not reimplementation of their
  scanner or graph logic.

## Technical Context

**Language/Version**: Go.

**Primary Dependencies**: Standard library only. No new dependency.

**Storage**: Local artifact files under an explicitly selected output
directory.

**Testing**: Focused package tests, CLI smoke tests, schema checks, and full Go
baseline.

**Target Platform**: Local CLI on developer/operator machines.

**Project Type**: CLI plus internal Go packages.

**Performance Goals**: Read bounded existing artifacts without loading full
`graph.json` unless needed. Keep generated handoff compact enough for agent
first-read use.

**Constraints**: Local-first and read-only by default. No network access, tool
installation, target mutation, global config writes, MCP registration, daemon
startup, watcher startup, credentials, raw private source snippets, unescaped
target-derived Markdown, or output writes outside the selected output directory.

**Scale/Scope**: First implementation is Bigtop-oriented but must use generic
artifact inputs and avoid hidden Bigtop-only file choreography.

## Constitution Check

- **I. Local-First And Read-Only By Default**: PASS. The command reads local
  roots/artifacts and writes only to the selected output directory.
- **II. Evidence State Honesty**: PASS. Candidate tools and next actions remain
  recommendations/gaps until local outputs are produced and imported.
- **III. Complement, Do Not Replace**: PASS. The feature selects and normalizes
  OSS/tool outputs instead of implementing scanner logic.
- **IV. SpecKit Before Implementation**: PASS after this plan, research,
  data-model, quickstart, contracts, tasks, analyze, and review disposition are
  present.
- **V. Test-First For Behavior**: PASS if focused tests precede behavior
  changes for preflight rendering, toolchain classification, evidence-state
  boundaries, and CLI no-network/no-mutation defaults.

## Project Structure

### Documentation

```text
docs/specs/087-bigtop-brownfield-preflight/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── preflight-bundle.md
│   └── toolchain-json.md
├── reviews/
└── tasks.md
```

### Source Code

```text
cmd/portolan/
└── main package remains thin through internal/app

internal/app/
└── CLI dispatch and help text for `portolan preflight`

internal/preflight/
├── artifact loading
├── target-shape summarization
├── toolchain classification
├── gap normalization
└── markdown/json rendering

schema/
└── preflight-toolchain.schema.json
```

**Structure Decision**: Put behavior in `internal/preflight`, keep
`cmd/portolan` thin through the existing `internal/app` dispatch pattern, and
add schema/docs/tests only for emitted machine-readable artifacts.

## Implementation Phases

1. **Plan/Review Foundation**: Complete SpecKit artifacts, drift review, and
   three opencode plan/task review lanes before code.
2. **US1 Target Shape Bundle**: Implement bounded artifact discovery/loading and
   `preflight.md`/`preflight-gaps.jsonl` for visible shape and blind spots.
3. **US2 Toolchain Inventory**: Implement `toolchain.json` classification and
   approval-boundary semantics.
4. **US3 Agent Handoff**: Implement `agent-handoff.md` with bounded start
   instructions for coding agents without turning Portolan into a harness.
5. **US4 Importer Decision Boundary**: Keep ast-index/Graphify/Understand
   Anything/importer work behind preflight recommendations and tests.
6. **PR Closeout**: Baseline checks, drift/quality lenses, opencode PR review,
   fixes, PR creation/update, and readiness report. No merge without user
   command.

## Verification

```bash
go test ./internal/preflight
go test ./internal/app
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan preflight --help
```

For fixture smoke, run the preflight command against a local fixture or existing
Bigtop artifact bundle without network access, tool install, target mutation,
global config writes, daemon startup, or watcher startup.

## Risks

- The preflight can become another report surface. Mitigation: generated output
  must route the agent/operator to existing artifacts and next tool decisions.
- Tool recommendations can be mistaken for evidence. Mitigation: separate
  recommendation status from evidence states in schema and tests.
- Bigtop-specific hidden choreography can creep back in. Mitigation: tests use
  generic artifact directories while quickstart names Bigtop as the first demo
  target only.
- Target-derived strings can become prompt-injection payloads in agent handoff
  Markdown. Mitigation: render paths/names as escaped bounded display strings
  and avoid copying source snippets or raw finding payloads.
