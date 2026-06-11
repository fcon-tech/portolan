# Feature Specification: Agent Analysis Claims Layer (106)

**Status**: Ready for implementation

**Input**: Legal path for LLM analysis into the bundle as tier-labeled claims. Direct tool evidence stays tier A; LLM output enters only as B/C/D.

| Tier | claim_tier | Portolan verifies |
|---|---|---|
| B | analytical | all cited refs resolve in bundle |
| C | synthetic | refs resolve; conclusion not verified |
| D | speculative | labeling only |

## Requirements

- **FR-001**: Contract `harness/contracts/analysis-claims.schema.json`; bundle artifact `claims.jsonl`. Record: `{id, claim_tier, statement, subject, cited_refs[], agent, created_at, evidence_state: "claim-only"}`. Subject: `landscape`, `repo:<id>`, or path.
- **FR-002**: Ref formats: `hotspot:<id>`, `gap:<id>`, `relationship:<id>`, `repo:<id>`, `path:<relpath>[:line]`, `producer_ref:<path>`.
- **FR-003**: `scripts/import-analysis-claims.sh <bundle> <claims-file>`: schema check + ref resolution. analytical/synthetic need ≥1 ref and all refs valid, else **rejected with reason** in `claims-import-report.json`; speculative allows 0 refs. No silent downgrades; importer never raises a tier; re-import replaces prior claims of the same agent.
- **FR-004**: `bundle-query` family `claims` (filters: tier, subject) + `/api/claims`; MCP tool mirrors family.
- **FR-005**: Agent instructions: `harness/SKILL.md` section + `harness/guardrails/analysis-claims.md` (how to query, pick tier, cite; forbidden: presenting B/C/D as tool facts).
- **FR-006**: `docs/evidence-model.md` documents claim tiers as claim-only subtypes. Claims are bundle-scoped: rescan invalidates unresolved refs at re-import (honest staleness).
