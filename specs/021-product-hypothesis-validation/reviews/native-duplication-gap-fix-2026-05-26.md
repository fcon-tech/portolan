# Product Hypothesis Ledger: Native Duplication Gap Fix

Date: 2026-05-26

## Hypothesis

Cursor-plus-Portolan becomes more useful for CTO-level repository questions
when `portolan map` can surface at least deterministic duplicate source/config
clusters without requiring a prepared jscpd output.

## Change

- Spec `011-duplication-detection` now implements native exact source/config
  duplicate clusters.
- `portolan map --root` emits observed `duplication` findings and graph nodes
  when exact duplicate clusters are locally visible.
- Near-clone and copy/paste similarity remain OSS/jscpd-backed and must stay
  `not_assessed` when no jscpd-style output is present.

## Evidence

- verified: `go test -count=1 ./internal/duplication ./internal/app -run 'TestDetect|TestRunMapDetectsExactSourceAndConfigDuplication|TestRunMapUnsupportedDetectorFindingsRemainNotAssessed|TestRunMapFindingsJSONLHasRequiredFields|TestRunMapSummaryIncludesCompactCounts'`
- verified: `go run ./cmd/portolan map --root testdata/duplication-detection/repo --out /tmp/portolan-011-duplication --force`
- verified: JSONL parse over `/tmp/portolan-011-duplication/findings.jsonl`
- verified: `/tmp/portolan-011-duplication/summary.json` reports two observed
  duplication findings.

## Updated Gap State

| Gap | Before | After |
| --- | --- | --- |
| `GAP-DUP-CFG-DEBT` | native duplication detector absent | exact source/config duplication partially addressed |
| jscpd/near-clone coverage | `not_assessed` without local output | still `not_assessed` without local jscpd-style output |
| duplicate-component coverage from SBOM | `not_assessed` without SBOM | still `not_assessed` without CycloneDX/Syft evidence |

## Product Interpretation

This improves the Cursor augmentation story for arbitrary source checkouts, but
does not prove full duplicate-component coverage. Cursor should answer:

- exact duplicate source/config clusters: from `findings.jsonl` when observed;
- near-clone/code-copy similarity: from jscpd-style local output when present;
- duplicate components/dependency drift: from CycloneDX/Syft evidence when
  present;
- otherwise: `not_assessed`.
