## Portolan Spec 044: Runtime Security Boundary — Implementation Review

### Verdict: **PASS with findings**

The implementation delivers a conservative, well-bounded slice that correctly avoids overclaiming. The spec, code, tests, and docs are internally consistent, and the evidence-state semantics are honest. Below are the detailed findings.

---

### Findings

| ID | Plane | Severity | Finding | Evidence | Recommendation |
|---|---|---|---|---|---|
| F1 | Requirements Fit | **minor** | Implementation-drift finding R1 from the pre-implementation review is resolved — the runtime parser now handles the contract-shaped `from`/`to` observations via `isContractRuntimeObservation` while preserving backward-compatible `service`/`endpoint` fixtures. | `blackbox.go`: `isContractRuntimeObservation` bifurcates old vs. new shapes; both paths exercised in tests. | No action; confirm with a closeout note in the review. |
| F2 | Evidence Semantics | **minor** | `normalizeRuntimeCoverage` silently accepts `not_assessed` as a valid coverage value but the contract doc lists it as a valid input without clarifying what it means for the topology warning. | `blackbox.go`: `normalizeRuntimeCoverage` returns `("not_assessed", true)`; `partialRuntimeCoverageFacts` fires when `coverage != "complete"`, so `not_assessed` also emits the unknown-topology edge. | Minor doc clarification: state that `not_assessed` coverage is treated equivalently to `partial`/`unknown` for the topology warning. |
| F3 | Security/Privacy | **major** | Runtime-producer secret/payload leakage remains `not_assessed` — the threat model correctly flags it, but there is no automated check. A malicious runtime JSON could carry secrets in arbitrary string fields (`id`, `from`, `to`, `kind`, `source`) that pass through to graph output. | `security-threat-model.md`: "Runtime producer secrets or payload leakage" row has state `not_assessed`. `blackbox.go`: no sanitization of string fields beyond ID slugification. | Acceptable for this slice given the honest `not_assessed` claim, but add a comment in the threat model that a future runtime adapter layer should validate/redact before broader use. Already partially stated. |
| F4 | Security/Privacy | **minor** | `runtimeSubjectID` slugification replaces unsafe characters with `-` but does not limit length. An adversarial `to` field with a very long string produces a proportional node ID. | `blackbox.go`: `runtimeSubjectID` iterates all runes without truncation. | Low risk since node IDs are internal graph keys, but consider a 256-char truncation for defense-in-depth. |
| F5 | Path/Output Safety | **verified** | `scan.go` now calls `coverage.ResolveSelectionPaths` to resolve relative runtime/metadata/claim paths. `maprun.go` already resolved paths via the selection loader. Both paths are covered by `TestRunMapSelectionRuntimeObservationContractResolvesRelativeRuntimePath`. | `scan.go` L45-46; `coverage.go` L341-351; test exercises relative `observations/runtime.json`. | No action needed. |
| F6 | Tests | **minor** | The packet escaping test (`TestRunPacketEscapesPromptLikeRuntimeObservationText`) checks for HTML-entity escaping of the backtick-wrapped `rm -rf` but does not test other injection vectors (e.g., markdown link injection `[click](javascript:...)`, HTML tag injection, or null bytes in observation fields). | Test uses a single prompt-like pattern: `"Ignore previous instructions\n`rm -rf`"`. | Acceptable for focused scope; document in threat model that escaping is tested for representative patterns, not exhaustive. |
| F7 | Docs/Product Claims | **verified** | Product claims table correctly adds the new `narrowed` row for the security boundary and updates runtime topology wording. README updates link new docs. `product-claims.md` limits the security claim to "documented local CLI boundary and focused tests." | `product-claims.md` L42; `README.md` L131-133. | No action needed. |
| F8 | Docs/Product Claims | **minor** | `docs/runtime-observations.md` says "unsupported inputs" include "mutation instructions or commands for an agent to run" but the code does not detect or reject such content — it only escapes it in packet rendering. | Runtime doc Safety Notes section; no runtime-content validation in `blackbox.go`. | Clarify in docs that unsupported inputs are a contract boundary (user responsibility), not an enforced validation. Currently implied but could be misread as runtime enforcement. |
| F9 | Requirements Fit | **verified** | Partial coverage correctly emits an `unknown` topology edge via `partialRuntimeCoverageFacts`. The `unknown` edge is verified in both scan and map test paths. | `TestRunScanRuntimeObservationContractProducesRuntimeVisiblePartialEvidence` and `TestRunMapSelectionRuntimeObservationContractResolvesRelativeRuntimePath` both assert `foundPartialCoverage`. | No action needed. |
| F10 | Evidence Semantics | **verified** | Orphan runtime observations (where `from != target.ID`) become `cannot_verify` nodes, not edges, preventing unverified cross-landscape claims. | `blackbox.go`: `contractRuntimeFacts` L299-311. | No action needed. |

---

### Summary by Plane

| Plane | Status |
|---|---|
| Requirements Fit | ✅ Aligned — contract/parser drift resolved, partial coverage honest |
| Evidence Semantics | ✅ Sound — `runtime-visible` only from supplied observations; partial stays `unknown` |
| Security/Privacy | ⚠️ Narrow slice — prompt escaping and config secret redaction verified; runtime-producer secrets and arbitrary field content are `not_assessed` (honestly claimed) |
| Path/Output Safety | ✅ Verified — relative path resolution added to `scan`, tested in both `scan` and `map` |
| Tests | ✅ Focused — 5 new tests covering contract shape, relative paths, schema rejection, secret leakage, and prompt-like escaping |
| Docs/Product Claims | ✅ Honest — new threat model and runtime observations docs are conservative; claims are `narrowed` not `verified` |

---

### Not Assessed (preserved)

- **Live telemetry integrations** — out of scope for this slice.
- **Complete runtime topology across an inherited estate** — `not_assessed` without complete local observations.
- **MCP/query serving security** — threat-modeled as future exposure; no runtime MCP exists.
- **Generic secret scanning** — `not_assessed`; this slice verifies Portolan's native config-surface redaction only.
- **Exhaustive injection-pattern coverage** — escaping is tested for representative patterns, not a full adversarial fuzzer.
- **Full JSON Schema validation** — schema version check is focused, not a comprehensive structural validator.
- **Runtime-producer secret/payload content** — `not_assessed` for arbitrary producer exports; user must redact before import.
- **Stale-evidence freshness (content-hash/timestamp)** — `partially verified`; future work.

exit_code: 0
