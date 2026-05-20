# Implementation Plan: Evidence Graph Diff

**Branch**: `006-evidence-diff` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)
**Input**: Product backlog P3-006: compare two evidence graphs and show what
became visible, changed, or stayed unknown.

## Summary

Add a local diff command for two Portolan evidence graph JSON files. The first
slice emits a machine-readable JSON diff that reports added, removed,
unchanged, and changed graph facts, including evidence-state transitions, but
does not assign readiness, improvement, degradation, or pass/fail verdicts.

## Technical Context

**Language/Version**: Go 1.26 module, standard library first.
**Primary Dependencies**: Go standard library; `jq` for JSON syntax checks.
**Input Formats**: Two local Portolan evidence graph JSON files.
**Storage**: Local graph inputs and explicit diff JSON output file.
**Testing**: `go test -count=1 ./...`; fixture diff command; `jq empty
schema/*.json`; `jq empty <diff-output>`; `git diff --check`.
**Target Platform**: Local CLI on macOS/Linux first.
**Project Type**: Single Go CLI.
**Performance Goals**: Fixture diff completes in under 1 second.
**Constraints**: No network, no daemon, no credentials, no mutation of source
graphs, no readiness verdicts, no rename detection in the first slice.
**Scale/Scope**: Compare two graph files by stable node and edge identity.

## Decision Gate

| Question | Answer |
| --- | --- |
| Simpler/Faster | Add `portolan diff --base <graph> --head <graph> --out <file> [--force]` and compare stable node/edge identities with stdlib JSON. |
| Blocking Edge Cases | Missing or malformed graph files must fail clearly or emit `cannot_verify` only if a future contract chooses graph-as-evidence; this slice should not turn unreadable inputs into a misleading partial diff. Evidence-state transitions must remain descriptive, not evaluative. |
| Existing Open Source | Generic JSON diff tools and libraries exist, but Portolan needs graph-aware fact identity and evidence-state transition reporting. A small stdlib implementation is justified for this narrow first slice; external JSON Patch or structural diff libraries would add dependency and output-shape risk without solving evidence semantics. |

## OSS Fit Review

| Candidate | Fit | Maturity | License Risk | Integration Cost | Decision |
| --- | --- | --- | --- | --- | --- |
| Go stdlib `encoding/json` | Good for Portolan-owned graph schema and deterministic fixture output. | Mature. | None. | Low. | Accept for first slice. |
| RFC 6902 JSON Patch libraries | Good for raw document changes, weak for graph fact semantics. | Mature ecosystem. | Varies by library. | Medium; output would not match product UX. | Reject for first slice. |
| `go-cmp` | Good for tests, not a user-facing graph diff format. | Mature. | Low. | Low in tests, but unnecessary for production code. | Defer unless tests need it. |
| External `jq`/CLI diff composition | Useful for ad hoc debugging, not portable product behavior. | Mature. | Low. | Medium; shelling out crosses dependency/runtime boundaries. | Reject for product path. |

## Constitution Check

| Rule | Status | Evidence |
| --- | --- | --- |
| Local-first and read-only | Pass | Diff reads two local graph files and writes only the selected output. |
| Evidence state honesty | Pass | Diff reports state transitions without upgrading unknown or claim-only facts. |
| Complement existing tools | Pass | Generic diff tools stay external; Portolan adds graph/evidence normalization. |
| SpecKit before implementation | Pass | This plan and tasks make P3-006 implementable before behavior changes. |
| Test-first behavior | Pass | Tasks start with fixtures and failing CLI/diff tests. |

## Project Structure

```text
cmd/portolan/
└── main.go

internal/
├── app/
├── diff/
└── graph/

testdata/evidence-diff/
├── base.json
└── head.json
```

## Design Decisions

| Decision | Rationale | Rejected Alternative | Reversibility | Risk If Wrong | Confidence |
| --- | --- | --- | --- | --- | --- |
| Add a top-level `diff` command | Evidence diff is a first-class product operation over graph files. | Hide diff under `packet` or `scan`. | Medium; command wrapper can be adjusted before stable release. | CLI taxonomy may need refinement when human summaries arrive. | Medium |
| Compare nodes by `id` and edges by `from`, `to`, and `kind` | Uses current stable graph identity without inventing rename detection. | Full structural JSON diff. | High; matching can grow later. | Duplicate same-kind edges between nodes may need richer identity later. | Medium |
| Emit machine-readable JSON first | Matches spec and keeps packet/human summary out of the first slice. | Generate Markdown immediately. | High. | Users may need `jq` until human rendering lands. | High |
| Report evidence-state transitions as data | Preserves honesty without readiness language. | Label transitions as better/worse. | High. | Consumers may want ranking later, but that needs a separate approved spec. | High |
| Fail malformed graph inputs clearly | Avoids diffing unknown input shape as if it were graph evidence. | Emit partial `cannot_verify` diff output. | Medium. | Users get a hard error where a future workflow might prefer reportable uncertainty. | Medium |

## Verification Plan

- Fixture tests for added, removed, unchanged, and changed nodes.
- Fixture tests for changed edges and evidence-state transitions.
- CLI test for `diff --base testdata/evidence-diff/base.json --head
  testdata/evidence-diff/head.json --out <file> --force`.
- Regression test proving diff output contains no readiness, pass/fail,
  improvement, or degradation fields.
- `go test -count=1 ./...`.
- `jq empty schema/*.json`.
- `go run ./cmd/portolan diff --base testdata/evidence-diff/base.json --head
  testdata/evidence-diff/head.json --out /tmp/portolan-diff.json --force`.
- `jq empty /tmp/portolan-diff.json`.
- `git diff --check`.

## Risks

- Current edge identity may be too small if multiple edges share `from`, `to`,
  and `kind`. Mitigation: record this as a known scope limit and keep first
  fixtures deterministic.
- Graph schema compatibility may evolve. Mitigation: decode only required
  fields and preserve schema version in the diff metadata.
- Diff output could be misread as a readiness judgment. Mitigation: tests and
  docs forbid evaluative field names and wording.
