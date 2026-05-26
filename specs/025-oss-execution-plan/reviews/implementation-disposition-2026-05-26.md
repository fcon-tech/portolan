# Implementation Disposition: OSS Execution Plan

Date: 2026-05-26

## Scope

Implemented `specs/025-oss-execution-plan/` to address the blind acceptance
gap where an empty `tool-registry.json` left Cursor with no safe next step for
OSS evidence production.

## Changes

- Added `oss-plan.json` to `portolan context prepare`.
- Recorded local producer availability for jscpd, Syft/CycloneDX, and Semgrep.
- Added safe command recipes that write under `<context-dir>/tool-outputs/`
  when a producer is available and no corresponding output is already present.
- Required a local Semgrep config and avoided network-backed `--config auto`.
- Updated context help, agent guide, Cursor rule, backlog, and hypothesis
  ledgers.

## OSS Command Source Check

- jscpd JSON reporter: official docs describe `--reporters json` and
  `jscpd-report.json`.
- Syft output formats: official docs describe `cyclonedx-json` and
  `-o <format>=<file>`.
- Semgrep CLI reference: official docs describe `semgrep scan`, `--json`,
  `--json-output`, and the network/metrics implications of registry-backed
  configs.

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| Unit tests | verified | `go test -count=1 ./...` passed. |
| Schema syntax | verified | `jq empty schema/*.json` passed. |
| Diff hygiene | verified | `git diff --check` passed. |
| Help text | verified | `go run ./cmd/portolan context prepare --help` lists `oss-plan.json`. |
| Fixture context smoke | verified | `go run ./cmd/portolan context prepare --root testdata/landscape-map --out /tmp/portolan-025-context --profile cursor --force` passed; `oss-plan.json` was parseable. |
| Bigtop context smoke | verified | `/tmp/portolan-025-bigtop-context` recorded 18 repositories, 0 registry tools, and `not_available`/`not_assessed` producer states without running scanners. |

## Review Findings

### Independent Lanes

| Lane | Status | Disposition |
| --- | --- | --- |
| local repo-grounded review | verified | No major correctness, evidence-state, path-safety, or command-safety blockers found. |
| `kimi-coding/kimi-for-coding` | not_assessed | Returned an attempted tool-use preamble instead of a review finding set. |
| `minimax/MiniMax-M2.7` | not_assessed | Provider returned `404 page not found`. |
| `zai/glm-5.1` | not_assessed | Returned only a preamble and no review finding set. |

### Dispositions

| Finding | Disposition |
| --- | --- |
| Portolan should not silently run external scanners. | accepted; this slice emits recipes only and keeps commands user-approved. |
| Semgrep `--config auto` can use network-backed registry behavior. | accepted; recipes require a local config and use `--metrics=off`. |
| Producer command syntax may drift. | accepted as residual risk; command source check was done against current official docs, but actual producer execution remains not assessed because the binaries were not installed locally. |
| Existing OSS outputs should be used before refresh. | accepted; existing families are marked `input_present` and no refresh command is emitted for that family. |

## Not Assessed

- Actual jscpd, Syft, and Semgrep execution against Bigtop is not assessed.
- Installing producer tools is not assessed.
- PR state, GitHub checks, and merge readiness are not assessed.
