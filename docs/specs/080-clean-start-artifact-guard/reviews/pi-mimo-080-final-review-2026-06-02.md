# Portolan Spec 080 — Clean-Start Artifact Guard
## Independent Review (post-review-driven fixes)

---

### Findings

#### **Low (1)**

**L-FIX-1: Acceptance doc defines "lane ledger" only in parenthetical prose**

`docs/agent/ACCEPTANCE.md` (lines 24–43) references "dated lane ledger" and "lane ledger" as the allowance surface for naming forbidden artifacts, but the first definition appears only at the end of the new block ("The lane ledger is the dated acceptance or spec-local review record for that run…"). Readers who scan top-down may miss the structural contract. Consider moving the definition sentence before the first bullet list or giving it its own heading/term line.

*Category: maintainability*

---

#### **Informational (2)**

**I-1: `freshArtifactBoundarySection` receives `out` (the output path) but the section heading says "Current context output"**

The naming is correct for generated context packs, but in future if the helper is reused for non-context artifacts the label could mislead. Not a bug today—just a note for when the helper is reused.

*Category: maintainability*

**I-2: `staleArtifactExclusion` and `baselineArtifactContamination` are private package-level constants**

This is fine for a single package, but if any future package needs the same wording (e.g., a CLI help renderer), the constants would need to be exported or the text re-duplicated. Acceptable now; worth a TODO comment if cross-package reuse is anticipated.

*Category: maintainability*

---

#### **Not Assessed**

| Item | Reason |
|---|---|
| **spec prose coherence** (080 plan.md / tasks.md) | Those files were not in the diff; cannot verify prose consistency with the fix. |
| **full integration with Cursor stress lanes** | Spec intent covers Cursor/agent stress lanes; the test exercises generated artifacts only. A real Cursor stress run exercising forbidden-artifact reads was not observed. |
| **lane ledger template or schema** | The acceptance doc defines what a lane ledger *is* but provides no template. Whether existing lane ledger files in the repo conform is not assessed here. |
| **GitHub review approval status** | Product backlog entry for P6-080 does not mention this; consistent with other items but not verified. |

---

### Verdict

**pass_with_findings**

**Rationale:**

| Lens | Status |
|---|---|
| **Requirements fit** | ✅ Shared constants ensure consistent boundary text across agent-brief, answer-contract, query-plan. |
| **Clean-start artifact boundary** | ✅ `Fresh Artifact Boundary` section present in all three generated docs; test asserts guard strings and absence of stale absolute paths/old-run references. |
| **Stale-path leakage** | ✅ Test explicitly asserts no stale context path, stale run path, or `old-run` substring survives into any generated artifact. |
| **Evidence-state honesty** | ✅ `contaminated` and `non-counting evidence` language present in answer-contract; acceptance doc forbids counting contaminated lanes as valid evidence. |
| **Local-first / read-only safety** | ✅ No target deletion, network, daemon, new dependencies, or runtime/producer execution in the diff. |
| **Test coverage** | ✅ `TestRunWritesFreshArtifactBoundaryGuidance` exercises the full `Run` → artifact generation → guard-string presence → stale-path absence chain. |
| **Maintainability** | ⚠ Minor definition-order issue in acceptance doc (L-FIX-1); informational notes on constant reuse (I-1, I-2). |

The fixes resolve the original review concerns (shared constants, stale-path test, acceptance doc clarification). No high or medium findings remain. The two low/informational items are non-blocking.
