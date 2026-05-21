# PR Changes Requested Disposition: PR #10 Relationship Detection

Date: 2026-05-21

Review verdict: CHANGES_REQUESTED

## Findings

| Severity | Finding | Disposition |
| --- | --- | --- |
| major | Machine-readable artifacts over-signaled relationship coverage because `run.json.skipped_surfaces` omitted unsupported relationship sub-surfaces and `findings.jsonl` dropped relationship `not_assessed` gaps once Go/go.mod relationships were observed. | Accepted and fixed. `run.json.skipped_surfaces` now includes non-Go source relationships, runtime inference, lifecycle modeling, and service-topology inference. `findings.jsonl` now always emits explicit relationship `not_assessed` findings for those unsupported sub-surfaces. |
| minor | Aggregate relationship finding used one `evidence_state` even when source imports and manifest dependencies coexisted. | Accepted and fixed. Observed relationship findings are split into source-import and manifest-dependency findings with `source-visible` and `metadata-visible` evidence states respectively. |
| minor | Readiness closeout recorded merge state `UNKNOWN` while current GitHub state was `CLEAN` at review time. | Re-checked and kept conservative. After the fix push, GitHub again reported `UNKNOWN`, so the closeout records merge state as `not_assessed` and preserves the re-check-before-merge warning. |

## Verification

| Check | Status |
| --- | --- |
| Focused tests: `go test -count=1 ./internal/app ./internal/maprun ./internal/relationships` | verified |
| Full tests: `go test -count=1 ./...` | verified |
| Schema syntax: `jq empty schema/*.json corpora/apache-bigtop/manifest.json` | verified |
| Map fixture command | verified |
| Bundle JSON/JQ checks | verified |
| Relationship skipped-surface and `not_assessed` finding checks | verified |
| `git diff --check` | verified |

## Focused Re-Review

| Lane | Status | Disposition |
| --- | --- | --- |
| `openrouter/qwen/qwen3.6-plus` | verified | APPROVED. The reviewer confirmed the major coverage over-signaling finding and the mixed aggregate evidence-state finding are fixed, with no remaining evidence-state concerns. |

## Residual Risk

- Unsupported relationship families are now explicit in machine-readable
  artifacts, but no new detector coverage was added.
- GitHub checks remain absent unless GitHub reports checks after push.
