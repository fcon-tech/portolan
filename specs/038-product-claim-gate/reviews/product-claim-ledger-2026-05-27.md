# Product Claim Ledger

Date: 2026-05-27

## Scope

This ledger classifies current Portolan product and client-facing claims from
`docs/mvp.md`, `docs/product-boundary.md`, `docs/product-backlog.md`, and
validation specs 034-037.

Allowed statuses: `accepted`, `narrowed`, `rejected`, `not_assessed`,
`blocked`, and `failed`.

## Claim Records

```json
{"id":"C001","claim":"Portolan helps an AI agent answer CTO-level questions with fewer unsupported claims than Cursor alone.","claim_type":"comparison","source":"docs/mvp.md; docs/product-backlog.md P4-034","target_scope":"headless Cursor Agent on fixed local Bigtop comparison","status":"narrowed","decision":"Accepted only for the fixed local Bigtop headless comparison: unsupported claims dropped from 12 to 0 and next actions were equal or better for all five questions.","evidence_links":[{"path":"specs/034-cursor-comparison-validation/reviews/implementation-disposition-2026-05-26.md","evidence_state":"verified","summary":"Records accepted comparison result and exact unsupported-claim counts."},{"path":"specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md","evidence_state":"verified","summary":"Records per-question comparison and limitations."}],"limitations":["UI Cursor/Composer remains not_assessed.","Full ecosystem completeness remains unknown.","Runtime topology, near-clone/SBOM duplication, and OSS producer execution were not fully assessed in spec 034."],"backlog_action":"none"}
{"id":"C002","claim":"Portolan provides a local, read-only context pack and optional evidence-backed map before agents answer.","claim_type":"capability","source":"docs/mvp.md; docs/product-boundary.md","target_scope":"implemented local CLI workflows and validation artifacts through current backlog","status":"accepted","decision":"Accepted as a capability claim: existing implemented specs provide local context/map artifacts and preserve explicit unknowns.","evidence_links":[{"path":"docs/product-backlog.md","evidence_state":"source-visible","summary":"Backlog lists context preparation, map, evidence-index, answer-contract, graph-index, and graph slice surfaces as implemented."},{"path":"specs/034-cursor-comparison-validation/reviews/portolan-artifacts-2026-05-26.md","evidence_state":"verified","summary":"Records generated context and map artifacts used in validation."}],"limitations":["This is a local capability claim, not a claim of complete inherited-estate coverage or external readiness."],"backlog_action":"none"}
{"id":"C003","claim":"Portolan understands a complete inherited software estate from a local target.","claim_type":"scope","source":"docs/product-backlog.md P1-016; docs/mvp.md Phase 4","target_scope":"complete inherited estate coverage","status":"rejected","decision":"Rejected as stated. Local repository scope and complete estate coverage must remain separate unless local inventory evidence verifies completeness.","evidence_links":[{"path":"specs/036-scope-completeness-validation/spec.md","evidence_state":"verified","summary":"Requires local scope and complete inherited-estate coverage to be validated separately."},{"path":"specs/036-scope-completeness-validation/reviews/pr16-merge-closeout-2026-05-27.md","evidence_state":"verified","summary":"Records merged scope-completeness validation and status consolidation."}],"limitations":["Client-safe language may say local visible scope is mapped; it must not say complete estate is known without inventory evidence."],"backlog_action":"none"}
{"id":"C004","claim":"Portolan can provide full runtime service topology.","claim_type":"capability","source":"docs/product-boundary.md; docs/mvp.md Phase 6","target_scope":"runtime-visible service topology","status":"not_assessed","decision":"Runtime-visible service topology remains not_assessed unless local runtime observations are supplied.","evidence_links":[{"path":"specs/037-relationship-evidence-taxonomy/spec.md","evidence_state":"verified","summary":"Requires runtime topology to remain not_assessed without runtime evidence."},{"path":"specs/034-cursor-comparison-validation/reviews/verification-2026-05-26.md","evidence_state":"not_assessed","summary":"Records runtime-visible service topology as not_assessed in the comparison validation."}],"limitations":["Relationship claims may describe source-visible, metadata-visible, claim-only, unknown, or cannot_verify evidence; runtime communication requires runtime observations."],"backlog_action":"none"}
{"id":"C005","claim":"Portolan composes existing OSS tool outputs instead of reimplementing mature scanners.","claim_type":"capability","source":"docs/product-boundary.md; docs/product-backlog.md P4-035","target_scope":"Syft/CycloneDX component identity on fixed local Bigtop; planned jscpd and Semgrep families","status":"narrowed","decision":"Accepted only for Syft/CycloneDX component identity evidence on the fixed Bigtop target. jscpd full run failed and Semgrep remains not_assessed.","evidence_links":[{"path":"specs/035-oss-producer-acceptance/reviews/implementation-disposition-2026-05-26.md","evidence_state":"verified","summary":"Records Syft/CycloneDX output and jscpd/Semgrep gaps."},{"path":"specs/035-oss-producer-acceptance/spec.md","evidence_state":"verified","summary":"Narrows OSS composition value to Syft/CycloneDX component identity evidence."}],"limitations":["Do not claim near-clone detection, Semgrep semantic findings, or broad OSS producer value from this evidence."],"backlog_action":"none"}
{"id":"C006","claim":"Portolan detects duplication across a landscape.","claim_type":"capability","source":"docs/mvp.md; docs/product-backlog.md P2-011","target_scope":"native exact source/config duplicates and planned/OSS-backed near-clones","status":"narrowed","decision":"Accepted for native exact source/config duplicate clusters; near-clone and SBOM/component duplication remain unproven or not_assessed in current validation.","evidence_links":[{"path":"docs/product-backlog.md","evidence_state":"source-visible","summary":"Backlog narrows P2-011 to exact source/config clusters and names near-clone detection as OSS/jscpd-backed."},{"path":"specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md","evidence_state":"verified","summary":"Records near-clone and SBOM/component duplication as not_assessed in the comparison."}],"limitations":["Client-safe language must not say near-clone or SBOM duplicate risk is validated."],"backlog_action":"none"}
{"id":"C007","claim":"Portolan detects relationships across imports, manifests, metadata, runtime exports, and claims.","claim_type":"capability","source":"docs/mvp.md; docs/product-boundary.md; docs/product-backlog.md P4-037","target_scope":"relationship claims by evidence type","status":"narrowed","decision":"Accepted only when relationship evidence type is named. Runtime-visible relationships remain not_assessed without runtime evidence.","evidence_links":[{"path":"specs/037-relationship-evidence-taxonomy/reviews/merge-closeout-2026-05-27.md","evidence_state":"verified","summary":"Records merged relationship evidence taxonomy and status alignment."},{"path":"specs/037-relationship-evidence-taxonomy/spec.md","evidence_state":"verified","summary":"Defines relationship evidence types and prohibits stronger claims without evidence."}],"limitations":["Do not collapse source-visible, metadata-visible, runtime-visible, claim-only, unknown, and cannot_verify relationships."],"backlog_action":"none"}
{"id":"C008","claim":"Portolan is a replacement for Cursor, coding harnesses, enterprise code intelligence, service catalogs, observability, modernization, or readiness tools.","claim_type":"readiness","source":"docs/product-boundary.md; AGENTS.md","target_scope":"product positioning","status":"rejected","decision":"Rejected by product boundary. Portolan is a complement and local discovery substrate, not a replacement or readiness gate.","evidence_links":[{"path":"docs/product-boundary.md","evidence_state":"source-visible","summary":"Lists these replacement claims as out of scope."},{"path":"AGENTS.md","evidence_state":"source-visible","summary":"Defines Portolan as a complement to existing tools and not a readiness gate."}],"limitations":["Client-safe answer must position Portolan as evidence preparation for agents."],"backlog_action":"none"}
{"id":"C009","claim":"Portolan can safely support claims about UI Cursor/Composer behavior.","claim_type":"comparison","source":"docs/product-backlog.md P4-034; specs/034-cursor-comparison-validation/reviews/verification-2026-05-26.md","target_scope":"UI Cursor/Composer","status":"not_assessed","decision":"UI Cursor/Composer behavior remains not_assessed in the current validation cycle.","evidence_links":[{"path":"specs/034-cursor-comparison-validation/reviews/verification-2026-05-26.md","evidence_state":"not_assessed","summary":"Records UI Cursor/Composer lane as not_assessed."},{"path":"docs/product-backlog.md","evidence_state":"source-visible","summary":"P4-034 status explicitly names UI Cursor/Composer as not_assessed."}],"limitations":["Use headless Cursor comparison wording only."],"backlog_action":"none"}
```

## Status Summary

| Status | Claims |
| --- | --- |
| accepted | C002 |
| narrowed | C001, C005, C006, C007 |
| rejected | C003, C008 |
| not_assessed | C004, C009 |
| blocked | none |
| failed | none |

## Backlog Actions

No backlog item needs a new status row from this ledger. Existing backlog rows
already preserve the material limitations:

- P4-034 names UI Cursor/Composer, full ecosystem completeness, runtime
  topology, near-clone/SBOM duplication, and OSS producer execution as
  `not_assessed`.
- P4-035 narrows OSS producer evidence to Syft/CycloneDX and records jscpd
  failure plus Semgrep `not_assessed`.
- P4-036 separates local scope from complete inherited-estate coverage.
- P4-037 keeps runtime relationship claims evidence-typed.

## External-Language Limitations

- Say "headless Cursor comparison on fixed local Bigtop" unless UI
  Cursor/Composer is newly validated.
- Say "local visible scope" unless a complete inventory proves estate
  completeness.
- Say "source-visible/metadata-visible/claim-only relationship evidence" unless
  runtime observations exist.
- Say "Syft/CycloneDX component identity evidence" rather than broad OSS
  producer validation.
- Say "exact duplicate clusters" rather than near-clone or SBOM duplicate risk
  unless those producers are validated.
