# Implementation Plan: Agent Skill Pack

**Branch**: `008-agent-skill-pack` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Product decision to test Portolan as a generic agent toolbox through
portable skills first, with Cursor as a cheap acceptance client.

## Summary

Add a portable Portolan agent guide, a thin Cursor project rule, and an example
evidence-backed report. This slice does not implement mapping behavior; it
defines the agent workflow and immediate Bigtop smoke wrapper. If `portolan map`
is missing, the smoke records that as a concrete product gap instead of waiting
for more internal development.

## Technical Context

**Language/Version**: Markdown and Cursor project rule files.
**Primary Dependencies**: None.
**Storage**: Repository-local guide, examples, and Cursor rule.
**Testing**: Static content checks, `go test ./...`, `jq empty schema/*.json`,
`git diff --check`.
**Target Platform**: Cursor first as acceptance client; guide must be portable
to other agent harnesses.
**Project Type**: Go CLI repository with docs/spec artifacts.
**Constraints**: No network, no mutation, no harness lock-in.

## Decision Gate

| Question | Answer |
| --- | --- |
| Simpler/Faster | Use Markdown guide plus Cursor rule; no MCP server or extension. |
| Blocking Edge Cases | Guide must not imply `portolan map` already exists; it must provide a current-command fallback for Bigtop smoke while pointing to spec 009 as the target map contract. |
| Existing Open Source | Agent skill/rule patterns are already supported by common harnesses; use plain files before building protocol integrations. |

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Guide commands are local and read-only by default. |
| Evidence state honesty | Pass | Guide requires evidence states and unknown/cannot-verify reporting. |
| Complement existing tools | Pass | Guide lets agents use Portolan with existing harnesses instead of replacing them. |
| SpecKit before implementation | Pass | This spec, plan, and tasks define the doc/rule slice. |
| Test-first behavior | Pass | Tasks include content checks before status update. |

## Project Structure

```text
agent/
├── AGENT_GUIDE.md
└── examples/
    └── map-report.md

.cursor/
└── rules/
    └── portolan-map.mdc
```

## Verification Plan

- Check guide mentions trigger phrases, current-command fallback, target map
  command, artifacts, evidence states, and stop conditions.
- Check Cursor rule delegates to `agent/AGENT_GUIDE.md`.
- Check example report has required sections and evidence columns.
- `go test ./...`.
- `jq empty schema/*.json corpora/apache-bigtop/manifest.json`.
- `git diff --check`.

## Risks

- The guide may become stale before `portolan map` exists. Mitigation: point to
  spec 009 and keep the command contract explicit.
- Cursor-specific language may leak into the portable guide. Mitigation: keep
  Cursor references in `.cursor/rules/` and acceptance docs only.
