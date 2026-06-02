## PR Review: Spec 077 Bigtop Callgraph And Symbol Closure

**Review planes**: requirements fit, product-boundary fit, evidence-state honesty, local-first/read-only safety, OSS composition posture, test/verification gaps, full symbol/reference/callgraph claim resolution.

---

### Findings

| # | Finding | Severity | Evidence | Recommendation |
|---|---------|----------|----------|----------------|
| 1 | **T014-T015 incomplete**: Three independent non-GPT review lanes and review disposition are open tasks. The packet contains no evidence these ran. | **critical** | `tasks.md` T014 `[ ]`, T015 `[ ]`; no `reviews/review-disposition-2026-06-02.md` in packet | Complete T014-T015 before PR. Do not merge with unassessed review lanes on a decision-record that gates C6/callgraph claims. |
| 2 | **T016-T019 incomplete**: Baseline checks, PR readiness closeout, PR creation, merge closeout are all open. | **major** | `tasks.md` T016-T019 `[ ]` | Complete per SpecKit workflow. Verdict cannot be `ready` with closeout tasks pending. |
| 3 | **Cursor stress prompt/output files referenced but not included in packet**: `stress/cursor-callgraph-symbol-prompt-2026-06-02.md` and `stress/cursor-callgraph-symbol-output-2026-06-02.md` are cited in `cursor-stress-ledger.md` and excerpted, but the actual files are not present for independent verification. | **major** | `cursor-stress-ledger.md` references files; packet contains excerpt only | Attach full prompt and output files to PR, or note in ledger why excerpt is sufficient. |
| 4 | **No explicit cannot_verify rationale for srcML structural-only limitation**: The decision record notes srcML is "not sufficient alone for resolved def/use or call graph," but does not explain *why* srcML's XML output lacks resolved edges (e.g., no type binding, no call target resolution). This weakens the record's defensibility if challenged. | **minor** | `graph-producer-decision-record-2026-06-02.md` srcML row | Add one sentence: srcML produces AST/XML structure without semantic analysis or type resolution, so edges remain syntactic and unbound. |
| 5 | **Maven "found" but not assessed as graph producer**: The availability ledger lists `mvn` as found, but the decision record does not evaluate whether Maven dependency:tree or effective-pom output could serve as *any* form of bounded graph evidence (not call graph, but artifact dependency graph). This is a minor gap in thoroughness. | **minor** | `producer-availability-ledger-2026-06-02.md` shows `mvn found`; decision record does not mention Maven | Either assess Maven's bounded utility or explicitly exclude it with rationale (build tool, not graph exporter; prior specs already covered artifact deps via jdeps). |

---

### Evidence-State Honesty Assessment

| Claim | State | Honest? |
|-------|-------|---------|
| Full Bigtop symbol/reference graph | `cannot_verify` | ✓ Yes — no producer available, no claim inflation |
| Bigtop call graph | `cannot_verify` | ✓ Yes — no call-graph exporter installed or run |
| C6/callgraph parity | `cannot_verify` | ✓ Yes — explicitly gated behind future approval + install + run + review |
| Producer absence (PATH probe) | `verified` | ✓ Yes — exact found/not-found list, versions recorded |
| Ctags/gopls/jdeps utility | `partial` | ✓ Yes — not upgraded to full graph |
| Cursor stress consistency | `verified` | ⚠ Partial — output excerpted, full files not in packet |

---

### OSS Composition Posture

| Aspect | Assessment |
|--------|------------|
| Prefer import over native extraction | ✓ Verified — decision record explicitly rejects native Portolan graph extractor |
| Compare mature producers | ✓ Verified — SCIP/LSIF, CodeQL, JDT LS, srcML, Joern, Ctags, gopls, jdeps all compared |
| License/maintenance/privacy posture | **not_assessed** — no explicit license or maintenance health evaluation of candidate producers; acceptable for a decision record that rejects all candidates due to absence, but would be required for an approval/install slice |

---

### Test/Verification Gaps

| Gap | Severity | Note |
|-----|----------|------|
| No independent non-GPT review completed | **critical** | T014-T015 open; blocks claim-boundary trust |
| Baseline checks (go test, go vet, jq, git diff --check) not run | **major** | T016 open; docs-only slice still requires baseline per plan |
| PR readiness/merge closeout not recorded | **major** | T017-T019 open |
| Full Cursor stress files not present | **major** | Hampers independent verification of stress assessment |

---

### Local-First / Read-Only Safety

| Check | Result |
|-------|--------|
| No network calls | ✓ Verified — PATH probes only |
| No daemon start | ✓ Verified |
| No target mutation | ✓ Verified |
| No credential use | ✓ Verified |
| No installation | ✓ Verified — all full-graph producers marked `not_found` |
| Write outside output directory | ✓ Verified — all artifacts in spec directory |

---

### Verdict

**`not_ready`**

The packet is structurally sound in evidence-state honesty, local-first safety, and OSS composition posture. The decision record correctly preserves `cannot_verify` for full graph claims and rejects native extraction. However, **critical workflow gaps remain**: independent review lanes (T014-T015) and all closeout tasks (T016-T019) are incomplete. The Cursor stress output is excerpted without the underlying files for verification.

**Do not merge.** Complete T014-T019, attach full stress artifacts, and re-review.

---

### Not Assessed

| Plane | Why |
|-------|-----|
| CRAP / Maintainability Index / CleanArch / SOLID | No code changes in packet |
| Runtime UI | No UI changes in packet |
| Code architecture metrics | No implementation code in packet |
| Actual graph output quality | No graph producer was available to run; correctly scoped out |
| Enterprise parity scoring | Deferred to spec 076 per plan |
