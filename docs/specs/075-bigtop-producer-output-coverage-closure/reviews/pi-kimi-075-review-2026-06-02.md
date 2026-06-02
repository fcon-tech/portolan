## Spec 075 Producer Coverage Closure — Review

---

### Plane 1: Requirements Fit & Goal Fidelity

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| Matrix scope is bounded subset of broad user objective | **Minor** | Goal states "architecture parity, runtime topology, real symbol/API/catalog/model/runtime producer outputs"; matrix delivers ~half (static/model only) | Document explicit scope reduction in spec header; reserve unmet dimensions for 076+ roadmap |
| Cursor Composer 2.5 stress preserved boundaries — no regression | **—** | Fact 6 | Accept; boundary discipline maintained |

---

### Plane 2: Evidence-State Semantics & Overclaim Risks

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| `cannot_verify` used for three distinct semantic categories: (a) blocked pending approval, (b) tool limitation, (c) pending paired validation | **Major** | Single label masks different action items and timelines | Disaggregate: `blocked_074_approval`, `tool_limitation`, `pending_076_validation` |
| Risk of reader inferring "will verify soon" for runtime topology when approval is indeterminate | **Major** | No explicit note that spec 074 approval is out-of-scope for 075 | Add explicit note: "Spec 074 runtime health run requires out-of-band approval; 075 does not advance this item" |
| "Partial" qualifiers on gopls and runtime evidence are accurate hedges | **—** | Facts 3, 4 | Accept; no overclaim |

---

### Plane 3: Producer Coverage Completeness vs. Seed Families

| Seed Family | Coverage | Gap | Severity |
|-------------|----------|-----|----------|
| Desired-state model (Docker Compose, Helm) | ✓ Bounded | — | — |
| Interface descriptors (protobuf) | ✓ Bounded | — | — |
| Static security (Semgrep local rules) | ✓ Bounded | Enterprise rule packs not assessed | Minor |
| Symbol/reference (Ctags multi-lang, gopls) | ◐ Partial | Full graph, call edges, cross-file resolution | Major (acknowledged) |
| Dependency (jdeps) | ✓ Bounded | Runtime classloader deps, module graph | Minor |
| Clone/copy-paste (jscpd) | ✓ Bounded | — | — |
| Runtime topology/lifecycle | ✗ Cannot verify | Blocked at 074 | — |
| API catalog / service contract | ✗ Not present | OpenAPI, gRPC service defs, GraphQL schema absent | **Critical** |

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| API/service contract producers entirely absent from matrix | **Critical** | User objective explicitly includes "API/catalog"; no OpenAPI, gRPC service reflection, or GraphQL schema listed | Add row: `api_contract` with state `not_assessed` and seed ticket for 076; or justify exclusion |
| Runtime-visible evidence from 073 is "partial" — unclear if bounded or incomplete | **Minor** | Fact 3 says "partial runtime-visible lifecycle/NodeManager evidence" | Clarify in matrix: `partial` = bounded sample or incomplete extraction? |

---

### Plane 4: Readiness Gaps Before PR

| Finding | Severity | Evidence | Recommendation |
|---------|----------|----------|----------------|
| No Portolan code change / no target mutation — review is documentation-only | **—** | Fact 7 | Accept; reduces regression risk |
| Matrix lacks version or date stamp for reproducibility | **Minor** | Spec 075 is a closure artifact; no `generated_at` or commit range noted | Add `matrix_generated_at` and `commit_range` fields |
| No explicit trace from matrix cell back to spec ticket (054-074) | **Minor** | "Covering specs 054-074" but no bidirectional links | Add `source_spec` column or footnote per row |

---

### Verdict

| | |
|:---|:---|
| **Merge** | Conditional |
| **Blockers** | (1) Disambiguate `cannot_verify` labels; (2) Add explicit out-of-band note for 074; (3) Address API/catalog absence — add `not_assessed` row or justify exclusion |
| **Non-blocking** | Version stamp, bidirectional spec trace, Semgrep enterprise gap |

---

### Not Assessed

- Actual matrix file content (not provided in facts; review is against stated claims only)
- Spec 076 paired Cursor validation design
- Performance or resource costs of listed producers
- False-positive rates for Semgrep, jscpd, Ctags outputs
