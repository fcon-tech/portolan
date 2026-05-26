# Review Disposition: Duplication Detection

Date: 2026-05-26

## Scope

- Spec: `specs/011-duplication-detection/`
- Implementation: native exact source/config duplicate cluster detection in
  `portolan map`, graph nodes, JSONL findings, agent guidance, backlog status,
  and product hypothesis ledger update.
- Explicit non-scope: near-clone/copy-paste similarity, AST-aware clone
  detection, duplicate-component coverage from SBOMs, and external scanner
  execution. Those remain OSS/jscpd or CycloneDX/Syft-backed and
  `not_assessed` when no local output exists.

## Decision Gate

- Simpler/Faster: implement a bounded exact-file detector with no new
  dependency. Use jscpd through existing `tool-registry.json` / `oss-plan.json`
  for richer similarity.
- Blocking Edge Cases: near clones, generated code, vendored dependencies,
  large files, binary content, and lockfiles can create noisy or private-heavy
  signals. The detector skips or degrades these surfaces rather than claiming
  complete duplication coverage.
- Existing Open Source: jscpd remains the mature local OSS detector for
  copy/paste and near-clone analysis. No in-house near-clone scanner was added.

## Review Lanes

- `zai/glm-5.1`: verified. Returned actionable findings.
- `minimax/MiniMax-M2.7`: not_assessed. Provider returned `404 404 page not
  found`.
- `kimi-coding/kimi-for-coding`: not_assessed. Lane produced no output and was
  terminated after hanging.

## Findings Disposition

| Finding | Source | Disposition |
| --- | --- | --- |
| Missing zero-duplicate fallback test for SC-003. | Zai | Rejected as already covered by `TestRunMapUnsupportedDetectorFindingsRemainNotAssessed`, which uses a non-duplicate fixture and requires a duplication `not_assessed` finding. |
| Missing skip-list tests for noisy/private-heavy inputs. | Zai | Accepted/fixed with `TestDetectSkipsNoisyPrivateHeavyInputs`. |
| Missing `--selection` path coverage for prefixed duplication findings. | Zai | Accepted/fixed with `TestRunMapSelectionDetectsPrefixedDuplication`. |
| Dead guard in `prefixedDuplicationFindings`. | Zai | Accepted/fixed by removing the conditional. |
| Unreachable tail in `duplicationFindings`. | Zai | Accepted/fixed by removing the dead branch and unused root dependency. |
| Missing negative test for near-identical but non-exact files. | Zai | Accepted/fixed with `TestDetectDoesNotClusterNearDuplicates`. |

## Verification

- verified: `go test -count=1 ./internal/duplication ./internal/app -run 'TestDetect|TestRunMapDetectsExactSourceAndConfigDuplication|TestRunMapSelectionDetectsPrefixedDuplication|TestRunMapUnsupportedDetectorFindingsRemainNotAssessed'`
- verified: `go test -count=1 ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`
- verified: `go run ./cmd/portolan map --root testdata/duplication-detection/repo --out /tmp/portolan-011-duplication --force`
- verified: JSONL parse over `/tmp/portolan-011-duplication/findings.jsonl`
- verified: `/tmp/portolan-011-duplication/summary.json` reports two
  duplication findings and four observed findings.
- verified: `scripts/bootstrap-portolan --help`

## Status

- Implementation: local implementation complete for exact source/config
  duplicate clusters.
- Local verification: passed.
- Review evidence: Zai lane dispositioned; Kimi and MiniMax degraded as
  `not_assessed`.
- PR state: not_assessed.
- GitHub checks: not_assessed.
- Merge readiness: not_assessed.
- Stop reason: local slice ready to commit; PR/readiness/merge surfaces are out
  of scope for this local commit.
