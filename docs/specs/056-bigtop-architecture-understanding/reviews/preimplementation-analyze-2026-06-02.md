# Pre-Implementation Analyze: Spec 056

Date: 2026-06-02
Branch: `codex/056-bigtop-architecture-understanding`

## Scope

Cross-artifact check across backlog row P6-056, spec 056, specs 054/055 merge
closeouts, Bigtop local artifacts, and the current product boundary.

## Decision Gate

- Simpler/Faster: evaluate Cursor-only vs Cursor-plus-Portolan using existing
  054/055 evidence before adding new producer import features.
- Blocking Edge Cases: Bigtop runtime topology and symbol/reference evidence
  are missing; complete enterprise code-intelligence parity is too broad for a
  single green/failed result.
- Existing Open Source: Cursor is the acceptance client; producer evidence
  remains local OSS/tool output normalized by Portolan.

## Status Reconstruction

| Surface | Current state |
| --- | --- |
| P6-054 | Merged; bounded Docker Compose, Helm, and Alluxio protobuf descriptor evidence verified as `metadata-visible`; symbol/reference, runtime, and full coverage remain `not_assessed`. |
| P6-055 | Merged; top-level runtime observation import verified on fixture; Bigtop runtime topology remains blocked/not_assessed because no local runtime export is selected. |
| Bigtop producer ledger | `/home/fall_out_bug/projects/bigtop-landscape/.portolan/producer-runs.jsonl` includes deployment-model and bounded API/catalog evidence plus explicit runtime and symbol `not_assessed` records. |
| Bigtop runtime | No safe local runtime observation export is selected. Runtime questions cannot pass. |
| 056 spec | Draft was ready to plan but had stale 054 branch metadata; fixed in this branch. |

## Findings

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| A1 | high | "Understands architecture like a human/enterprise code intelligence" is too broad without a rubric and claim ledger. | Accepted; define fixed questions and score claim-by-claim. |
| A2 | high | Runtime topology and symbol/reference claims remain unsupported for Bigtop. | Accepted; expected `blocked`/`not_assessed` unless evidence appears. |
| A3 | medium | Existing 054 artifacts are bounded and can support only scoped deployment/API/catalog claims. | Accepted; rubric prevents generalization. |
| A4 | medium | Cursor-only vs Cursor-plus-Portolan must use identical questions. | Accepted; use the same question set for both lanes. |

## Implementation Gate

Proceed with question/rubric definition and Cursor comparison. Do not update
public/product claims beyond the verified ledger scope.
