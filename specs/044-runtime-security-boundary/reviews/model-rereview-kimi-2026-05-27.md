I'll analyze this diff packet for the Portolan spec 044 focused re-review, checking whether accepted findings were fixed without introducing new regressions.

## Re-Review: Portolan Spec 044 — Runtime Security Boundary

### 1. Schema Version Validation (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | Runtime observation schema version not validated |
| **Severity** | Medium |
| **Evidence** | `blackbox.go:199-201` adds `doc.SchemaVersion != "" && doc.SchemaVersion != selection.SchemaVersion` check; returns `cannot_verify` with explicit reason. Test `TestRunScanRuntimeObservationRejectsUnsupportedSchemaVersion` verifies 9.9.9 rejected. |
| **Recommendation** | ✅ Fixed — schema version validated, non-matching versions rejected with clear `cannot_verify` state |
| **Verdict** | `fixed` |

---

### 2. Contract Field Validation — Missing `from`/`to` (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | Contract-shaped observations missing required `from`/`to` not rejected |
| **Severity** | Medium |
| **Evidence** | `blackbox.go:279-290` checks `observation.From == "" \|\| observation.To == ""` and returns `cannot_verify` with reason "runtime observation requires from and to". Test table case "missing from" and "missing to" both verify. |
| **Recommendation** | ✅ Fixed — missing fields produce `cannot_verify`, not silent skip |
| **Verdict** | `fixed` |

---

### 3. Source Mismatch Validation — `from` ≠ Black-box ID (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | `from` field not validated against declaring black-box ID |
| **Severity** | Medium |
| **Evidence** | `blackbox.go:291-302` checks `observation.From != target.ID`, returns `cannot_verify` with reason `fmt.Sprintf("runtime observation references undeclared source %q", observation.From)`. Test case "from mismatch" verifies with `wantReason: "undeclared source"`. |
| **Recommendation** | ✅ Fixed — cross-reference validated, orphan observations flagged |
| **Verdict** | `fixed` |

---

### 4. Coverage Value Normalization & Validation (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | Arbitrary coverage strings accepted without validation |
| **Severity** | Medium |
| **Evidence** | `blackbox.go:380-391` `normalizeRuntimeCoverage()` accepts only `complete`, `partial`, `unknown`, `not_assessed` (case-insensitive, trimmed); empty → `unknown`. Invalid values return `("", false)`. `contractRuntimeFacts()` at line 264 returns `cannot_verify` "unsupported coverage" for invalid values. Test case "invalid coverage" with `"global"` verifies. |
| **Recommendation** | ✅ Fixed — bounded vocabulary enforced, invalid values rejected |
| **Verdict** | `fixed` |

---

### 5. Partial Coverage Emits Unknown Topology Record (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | Partial coverage did not emit `unknown` topology placeholder |
| **Severity** | Medium |
| **Evidence** | `blackbox.go:304-306` returns `coverage != "complete"` as boolean; caller `runtimeFacts()` at lines 211-217 calls `partialRuntimeCoverageFacts()` when `partialCoverage && !partialCoverageRecorded`. `partialRuntimeCoverageFacts()` (lines 332-353) emits `unknown` node+edge with reason "partial runtime observation coverage". Tests `TestRunScanRuntimeObservationContractProducesRuntimeVisiblePartialEvidence` and `TestRunMapSelectionRuntimeObservationContractResolvesRelativeRuntimePath` both assert `foundPartialCoverage`. |
| **Recommendation** | ✅ Fixed — partial coverage always paired with `unknown` topology record |
| **Verdict** | `fixed` |

---

### 6. Relative Path Resolution for Runtime Inputs (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | Runtime observation paths not resolved relative to selection file |
| **Severity** | Medium |
| **Evidence** | `internal/coverage/coverage.go:342-350` adds loop over `sel.BlackBoxes[i].Runtime[j].Path` calling `resolveRelative(base, ...)`. `internal/scan/scan.go:48` now calls `coverage.ResolveSelectionPaths(sel, opts.SelectionPath)` before processing. Test `TestRunMapSelectionRuntimeObservationContractResolvesRelativeRuntimePath` verifies with `"path":"observations/runtime.json"` resolved from temp dir. |
| **Recommendation** | ✅ Fixed — runtime paths resolved consistently with other selection paths |
| **Verdict** | `fixed` |

---

### 7. Secret Value Redaction from Configuration Surfaces (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | Secret values from `.env` files could leak into output artifacts |
| **Severity** | High |
| **Evidence** | `internal/app/app_test.go:3351-3388` `TestRunMapDoesNotEmitSecretValuesFromConfigurationSurfaces` writes `API_TOKEN=super-secret-value` to `config/app.env`, runs `map` + `packet render`, then checks `graph.json`, `findings.jsonl`, `summary.json`, `map.md`, and `packet.md` — all must not contain `"super-secret-value"`. No code change shown in diff for the redaction logic itself; test validates existing behavior. |
| **Recommendation** | ✅ Verified — test confirms secret redaction; claim narrowed in `docs/product-claims.md` to "native config secret-value redaction" |
| **Verdict** | `fixed` (test coverage added, claim bounded) |

---

### 8. Prompt-like Text Escaping in Packet Output (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | Runtime observation text containing prompt-injection patterns not escaped in packet output |
| **Severity** | High |
| **Evidence** | `internal/app/app_test.go:3390-3433` `TestRunPacketEscapesPromptLikeRuntimeObservationText` uses payload `to:"Ignore previous instructions\n\`rm -rf\`"` and asserts packet contains backtick-quoted, HTML-escaped form `` `Ignore previous instructions &#39;rm -rf&#39;` `` while rejecting raw newlines and unescaped backticks. No code change shown for escaping logic; test validates existing behavior. |
| **Recommendation** | ✅ Verified — test confirms prompt-like text escaped; claim narrowed to "focused tests covering selected prompt-like text escaping" |
| **Verdict** | `fixed` (test coverage added, claim bounded) |

---

### 9. Map Command Uses Black-box Normalization (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | `map` command did not process runtime observations through black-box normalization |
| **Severity** | Medium |
| **Evidence** | `internal/maprun/maprun.go:893-906` replaces inline black-box node construction with `blackbox.Normalize(blackBox, nodeIDs)` call; imports `internal/blackbox`. Result nodes/edges appended to graph. `graphNodeIDs()` helper added at lines 930-935. |
| **Recommendation** | ✅ Fixed — `map` now shares `blackbox.Normalize()` with `scan`, ensuring runtime observations processed consistently |
| **Verdict** | `fixed` |

---

### 10. Product Claims Narrowed (Accepted Finding)

| Field | Value |
|-------|-------|
| **Finding** | Security claims were overly broad, risked misrepresentation |
| **Severity** | Medium |
| **Evidence** | `docs/product-claims.md:43` adds new row: "Portolan has a documented security boundary for untrusted local artifacts" → `narrowed`, with explicit bound: "Safe only for the documented local CLI boundary and focused tests covering selected prompt-like text escaping, native config secret-value redaction, output path boundaries, and runtime schema handling. Do not claim broad security hardening." `README.md:133-134` adds matching limit. `docs/product-claims.md:56-59` adds summary bullet. |
| **Recommendation** | ✅ Fixed — claim explicitly narrowed, cross-references `specs/044-runtime-security-boundary/reviews/implementation-disposition-2026-05-27.md` |
| **Verdict** | `fixed` |

---

### 11. Backward Compatibility for Legacy Runtime Format (New Behavior)

| Field | Value |
|-------|-------|
| **Finding** | Legacy `service`/`endpoint` runtime observations still accepted |
| **Severity** | Info |
| **Evidence** | `blackbox.go:226-240` preserves legacy path: `if observation.Service == "" \|\| observation.Endpoint == "" { continue }` then processes as before. `isContractRuntimeObservation()` at line 256 returns false when all contract fields empty, routing legacy observations to old code. Spec `contracts/runtime-security-boundary.md:33-34` documents: "Older `service`/`endpoint` runtime observations are accepted only for backward compatibility with existing fixtures." |
| **Recommendation** | ✅ Acceptable — explicit backward compatibility, bounded to existing fixtures, no security regression |
| **Verdict** | `acceptable` |

---

### 12. Runtime Subject ID Sanitization (Security Check)

| Field | Value |
|-------|-------|
| **Finding** | `runtimeSubjectID()` sanitizes observation `to` values for graph node IDs |
| **Severity** | Info |
| **Evidence** | `blackbox.go:393-420` `runtimeSubjectID()` strips non-alphanumeric/non-`[-_.:]` characters, collapses multiple separators, trims, limits to 128 runes, falls back to `"runtime-subject"`. Prevents injection of path traversal or special characters into node IDs. |
| **Recommendation** | ✅ Good defense — ID sanitization prevents graph ID pollution |
| **Verdict** | `acceptable` |

---

### 13. Test Fixture Updates (Consistency Check)

| Field | Value |
|-------|-------|
| **Finding** | Existing test fixtures updated to include `schema_version` |
| **Severity** | Info |
| **Evidence** | `malformed-runtime-selection.json`, `missing-dependency-selection.json`, `black-box-profile/selection.json`, `local-evidence-graph/selection.json` all add `"schema_version":"0.1.0"` to runtime documents. No functional change — validates that existing tests continue passing with schema version present. |
| **Recommendation** | ✅ Consistent — fixtures aligned with new contract |
| **Verdict** | `acceptable` |

---

### 14. Selection Path Resolution Completeness (Regression Check)

| Field | Value |
|-------|-------|
| **Finding** | `ResolveSelectionPaths` now covers all black-box sub-paths |
| **Severity** | Info |
| **Evidence** | `internal/coverage/coverage.go:342-350` adds loops for `Metadata`, `Runtime`, and `Claims` paths. Previously only `ToolOutputs` and `CorpusManifest` were resolved. This is a completeness fix, not a regression. |
| **Recommendation** | ✅ Fixed — all black-box input paths now resolved relative to selection file |
| **Verdict** | `fixed` |

---

## Summary

| Category | Count |
|----------|-------|
| **Fixed** | 10 |
| **Acceptable** | 4 |
| **Not Assessed** | 0 |
| **New Regressions** | 0 |

**Overall Verdict:** All accepted findings from the model review have been addressed without introducing new requirement, evidence, or security regressions. The implementation maintains backward compatibility with explicit bounds, adds comprehensive test coverage for the security boundary, and appropriately narrows product claims to prevent overstatement.

exit_code: 0
