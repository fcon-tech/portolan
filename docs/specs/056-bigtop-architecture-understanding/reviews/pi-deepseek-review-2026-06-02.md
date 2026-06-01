# Architecture Understanding Acceptance Ledger — Review Findings

## Verdict: **conditionally_approved** with 2 critical remediations required before merge

The ledger shows honest division between "improved evidence discipline" (scoped, defensible) and "architecture understanding" (not proven). The primary risk — overclaiming architecture understanding — is largely contained. However, two structural issues must be fixed to pass review.

---

## Critical (merge-blocking)

### C1 — Q8 status `partial` is self-referentially invalid for scoring the same ledger

**Evidence:** Q8 asks "does Portolan improve on Cursor-only?" The answer cites "this Portolan lane output" vs "supplied Cursor-only bounded baseline summary" and admits "No scoring ledger artifact provided." The resulting `partial` status uses the ledger-under-review as its own evidence.

**Problem:** If the acceptance ledger is the subject of Q8, the ledger cannot cite itself as scoring evidence without circularity. The Q8 answer says "cannot verify improvement claim end-to-end without ledger" — but the ledger *is* what's being reviewed. This creates an unresolvable self-reference.

**Required:** Q8 must be `blocked/not_assessed` for this review cycle, with an explicit note that external adjudication (not the ledger author) would be needed to score the comparison. Alternately, produce a scored rubric artifact that Q8 can reference without circularity.

---

### C2 — Product claim boundary "Allowed wording" overstates the 18-repo corpus claim

**Evidence:** Allowed wording says:

> "Portolan supports scoped claims about the selected Bigtop corpus..."

**Problem:** The selected 18-repo corpus includes `apache-hadoop`, `apache-spark`, etc. — repos for which Q2 explicitly states "Other selected repos... not classified as packaging surfaces" and Q1 states per-repo roles are "not_assessed for most component repos." The word "selected Bigtop corpus" implies coverage of the whole corpus, but only `apache-bigtop-repo` and `alluxio` (bounded: monitor chart, gRPC descriptors) have any assessment. The remaining ~16 repos have zero evidence beyond discovery.

**Required:** Narrow "selected Bigtop corpus" to the two assessed repos, or split the claim: "Portolan discovered 18 repos and assessed architecture role for `apache-bigtop-repo` (hub) and bounded deployment/API surfaces for `alluxio` (monitor Helm, gRPC descriptors). Roles for remaining 16 repos are not_assessed."

---

## Major (should-fix before merge)

### M1 — Q1 `verified scoped` weakens under corpus-boundary honesty rules

**Evidence:** Q1 is `verified (scoped)` with the caveat "Whether repos outside local discovery constitute the full Bigtop landscape remains unknown."

**Problem:** The word `verified` implies validation. But the claim "`apache-bigtop-repo` is the packaging/deployment/interoperability-testing hub" derives from a single conceptual README snippet — not from structural analysis of repo contents, cross-repo dependency graphs, or comparison against component repos. This is a `metadata-visible` classification from a conceptual doc excerpt, not a verified structural finding.

**Recommendation:** Reclassify Q1 as `partial (metadata-visible)` or add an explicit note: "Verified scoped to README-level role claim; no structural repo analysis performed."

---

### M2 — Q2 lists `producer-run-alluxio-helm-monitor-20260601` as "deployment/packaging surface" but the monitor chart is an observability adjunct, not deployment

**Evidence:** Q4 correctly scopes the monitor chart as "observing an Alluxio cluster" with explicit "not Alluxio core master/worker/job layout." But Q2 lists it as a deployment/packaging surface alongside Bigtop Compose.

**Problem:** A monitor Helm chart is not a deployment surface — it's instrumentation for an already-deployed cluster. Listing it under "Deployment/packaging surfaces" overclaims its role.

**Recommendation:** Either reclassify Q2's Alluxio evidence as "observability/instrumentation surface" (separate category) or add a clear scoping note that this is a monitoring adjunct, not a deployment model.

---

### M3 — Q9 "Allowed wording" lacks explicit `metadata-visible` qualifier on Compose/Helm/Proto claims

**Evidence:** Allowed wording says Portolan can claim "Bigtop Docker Compose deployment model, the Alluxio monitor Helm model, and bounded Alluxio gRPC descriptor evidence" without a `metadata-visible` qualifier.

**Problem:** The Disallowed wording correctly blocks "Portolan verifies Bigtop runtime topology." But the Allowed wording says "deployment model" and "Helm model" — terms that a casual reader could interpret as verified runtime/models. Q3 and Q4 both carry explicit `metadata-visible` / not-runtime limitations. The product boundary should carry those same qualifiers.

**Recommendation:** Add `metadata-visible` or "static declared" qualifier to the Compose and Helm claims in Allowed wording. E.g., "the Bigtop Docker Compose declared configuration model (metadata-visible, not runtime)" and "the Alluxio monitor Helm declared template (metadata-visible, not runtime)."

---

## Minor (optional but noted)

### m1 — Acceptance Result "Verified" section omits coverage boundary

The Verified bullet "Q1 scoped architecture role" doesn't restate the scoping — that this is a README-level claim on one repo. Consider adding "(README-level, one repo)" inline.

### m2 — Spec status line in `spec.md:7` may be stale

`spec.md:7` says "In implementation" — if this review completes and the ledger is accepted, update to reflect post-review state.

### m3 — Backlog row P6-056 is unusually long

The status column contains substantial narrative. Consider moving some of that detail to the spec or tasks.md, keeping the backlog row to a terse summary + link.

### m4 — Q9 "Safe public claims" paragraph conflates "054/055-style evidence" with "056 evidence"

The text says "after 054/055-style evidence in this packet" — 054/055 are earlier specs. Re-reading suggests this should be "after evidence discipline established in 054/055 and applied here" — minor clarify.

---

## Not Assessed (by this review)

| Item | Reason |
|------|--------|
| Cursor-only bounded output Q1-Q9 correctness | Only the summary claims were supplied, not the raw outputs. |
| Producer-run output fidelity (Compose JSON, Helm template render, gRPC descriptor coverage) | Not re-executed; trust the ledger's reference to those artifacts. |
| Whether the 18-repo discovery is complete for the local checkout | Corpus completeness is declared `unknown` per spec; review doesn't re-verify. |
| Comparison against unrestricted Cursor workspace exploration | Both full-workspace attempts were excluded (malformed/hung). The bounded comparison is the only available baseline. |
| Whether Portolan produces the claimed `producer-run-*` artifacts in the stated paths | Artifact paths are not validated against filesystem; ledger is the evidence. |

---

## Summary

| Category | Count | Items |
|----------|-------|-------|
| Critical | 2 | C1 (Q8 circular self-reference), C2 (overbroad "selected corpus" claim) |
| Major | 3 | M1 (Q1 verified→partial), M2 (monitor chart misclassified as deployment surface), M3 (missing metadata-visible qualifier in allowed wording) |
| Minor | 4 | m1–m4 (inline clarifications) |
| Not assessed | 5 | Raw outputs, producer fidelity, corpus completeness, full-workspace baseline, artifact paths |

**Bottom line:** The ledger honestly distinguishes "evidence discipline" from "architecture understanding." Fix C1/C2 and strongly consider M1-M3, then merge. The product boundary is nearly right — just tighten the corpus scope and add the `metadata-visible` qualifier.
