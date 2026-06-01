## Post-Slice Review: `codex/053-language-agnostic-producers`

### Verdict: `pass_with_changes`

### Decision Gate Assessment

**Status: aligned**

The implemented behavior correctly constrains the scope to extending `context prepare` with new evidence-index record types. No new CLI surface, MCP tool, producer runner, or language adapter was introduced. The gate's blocking edge cases (overread as verified, overextended to runtime, overextended to whole estate) are addressed through honest `not_assessed` statuses and object-form candidate tools with explicit verification/support states. The guardrail tests in the JSONL fixture file confirm rejection of `runtime_topology`, plain-string `candidate_tools`, and `not_assessed` evidence sources for accepted/narrowed evaluations.

---

### Critical Findings

**None.**

---

### Major Findings

| # | Finding | Evidence |
|---|---------|----------|
| **M1** | `producer-recommendation` records added during `context prepare` for missing families use `status: not_assessed` and `evidence_state: not_assessed`, but the packet does not describe how `evidence_state` is serialized in the evidence-index path. The `producer-recommendation` record type in the schema may not include an `evidence_state` field—only `status` and candidate tool fields. If the code writes `evidence_state` into evidence-index JSONL but the schema doesn't define it, this is a schema/contract mismatch. | Packet claims `evidence_state: not_assessed` for recommendations, but `producer-recommendation` schema typically has `status` not `evidence_state`. Cannot verify schema field existence without reading the schema file. |
| **M2** | Coverage records are described as "repository-scoped," yet the packet says `context prepare` reads evaluation files from root/root `.portolan`/root `reports`/repository root/repository `.portolan`/repository `reports`. If there are multiple repositories in scope, coverage scoping may leak or miss records depending on which root paths are searched. The multi-repo deduplication or per-repo scoping logic is not described. | Packet says "repository-scoped" but file search includes both "root" and "repository" paths ambiguously. |

---

### Minor Findings

| # | Finding | Evidence |
|---|---------|----------|
| **m1** | JSONL fixture files under `internal/testfixtures/` may be referenced by name (`language-agnostic-producers/*.jsonl`) but the verification command uses a glob over `internal/testfixtures/language-agnostic-producers/*.jsonl`. The directory name in the spec header is `language-agnostic-producers` but nested inside `internal/testfixtures/`—this is consistent but a review-level note. | Packet directory listing and `jq empty` invocation both use the hyphenated name. No conflict observed. |
| **m2** | The file search for `producer-family-records.jsonl` or `producer-evaluations.jsonl` searches six paths but only surfaces evaluation records. If both files exist (one with evaluations, one with coverage or recommendations), silent discard of coverage or recommendation records from those files may surprise users who placed them there intentionally. Malformed files produce `cannot_verify` evidence-index records, which is honest, but the boundary between "malformed" and "valid but wrong record type for this path" is not specified. | Packet says "validates and surfaces only evaluation records." |
| **m3** | `answer-contract.md` now forbids defaulting to Portolan-owned PHP/JVM/Scala adapters, but the packet doesn't mention whether this constraint is enforceable or only advisory. If an LLM agent ignores this, there's no guardrail in the evidence-index path to prevent hallucinated adapter claims. | Packet says "forbids defaulting" but doesn't describe enforcement. |
| **m4** | Candidate tools examples (CycloneDX, SCIP/LSIF, etc.) are listed as "Existing Open Source" in the gate but the packet doesn't describe any fixture or schema records exercising these specific tool names. The OSS composition claim is not verified against concrete fixture data. | `not_assessed` — insufficient evidence to confirm OSS tool exemplars appear in fixtures. |

---

### Verification Checklist Assessment

| Claim | Assessment |
|-------|------------|
| `go test -count=1 ./...` passes | `verified_by_evidence` (command listed) |
| `go vet ./...` passes | `verified_by_evidence` |
| `jq empty` on schemas and fixtures passes | `verified_by_evidence` |
| `git diff --check` passes | `verified_by_evidence` |
| `context prepare --help` works | `verified_by_evidence` |
| Guardrails reject `runtime_topology`, plain-string `candidate_tools`, unsupported enums, accepted/narrowed with `not_assessed` evidence | `verified_by_evidence` (JSONL fixtures described as covering these) |
| Producer recommendations use object-form candidate tools with `verification_state: not_assessed` and `support_state: candidate_only` | `verified_by_evidence` (code behavior described) |
| `producer-recommendation` records emitted into evidence-index with `status: not_assessed` | `verified_by_evidence` |
| `answer-contract.md` updated to forbid Portolan-owned adapter defaults | `not_assessed` — no diff or text excerpt provided |
| `query-plan.md` updated to inspect coverage/recommendation records | `not_assessed` — no diff or text excerpt provided |
| Coverage records scoped correctly per repository | `not_assessed` — multi-repo behavior not described |

---

### Recommendation

- **Major M1:** Verify that the evidence-index serialization of `producer-recommendation` records matches the record schema. If `evidence_state` is written but not in the schema, either add it to the schema or remove it from the serialization path. Add a test crossing schema validation with evidence-index output.
- **Major M2:** Clarify doc/packet on how "repository-scoped" coverage works when multiple repositories are present. If the current behavior is "first-match from any of six paths applies globally," document that limitation.
- **Minor m2:** Document that the six-path file search only promotes evaluation records; other record types are discarded silently (or add a diagnostic).

**Overall: pass_with_changes** — two major findings require attention before marking complete.
