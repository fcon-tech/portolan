## Portolan Spec 069 – Architecture Synthesis Slice Review

### Verdict: `ready_with_minor_fixes`

---

### Findings

**1. Evidence-state boundary violation — C3 claim wording is too strong**
- severity: **critical**
- evidence: `stress/cursor-architecture-synthesis-output-2026-06-02.md` and `reviews/architecture-synthesis-ledger-2026-06-02.md` record C3 as *"upgraded to verified bounded metadata-visible"*.
- issue: The allowed wording permits *"verified bounded producer outputs beyond Syft/CycloneDX for static deployment models, API/catalog descriptors"*. However C3 (API/catalog descriptors) derives from Semgrep/ctags/protobuf descriptors — these are **source/static outputs**, not runtime topology descriptors. The C3 evidence state is **source-visible** plus **metadata-visible**, not runtime-visible. The review verdict implies Portolan *verified* an understanding of the runtime API/catalog surface, when the evidence only covers static descriptors extracted from source trees and Compose/Helm configs — which Syft/CycloneDX do not produce, but still remain static representations, not runtime-resolved descriptors.
- recommendation: Downgrade C3 to *"partial, verified bounded source-visible and metadata-visible static API/Catalog descriptor outputs beyond Syft/CycloneDX"*. Add a note: *"runtime-resolved API/catalog descriptors remain cannot_verify without service connectivity."*

---

**2. C8 incomplete — missing Cursor-only vs Cursor+Portolan full rubric rerun**
- severity: **major**
- evidence: `reviews/architecture-synthesis-ledger-2026-06-02.md`, C8 row: *"partial, no post-wave paired Cursor-only vs Cursor+Portolan full rubric rerun"*. Also `stress/cursor-architecture-synthesis-output-2026-06-02.md` contains only one synthesis output.
- issue: FR-006 requires recording *"whether human/enterprise parity is verified, partial, blocked, or unverified"*. C8 (enterprise-parity comparison) is assessed as **partial** explicitly because no Cursor-only baseline was run for comparison. Running only one synthesis pass (Cursor+Portolan) makes the parity check inherently incomplete — partial is the correct state per the evidence, but the slice ships this as-is. The spec does not require a second synthesis pass (FR-005 prohibits service starts), but it should explicitly acknowledge this as a known gap rather than leaving it as an implicit unverified parity check.
- recommendation: Add a statement in the ledger or review output: *"C8 parity remains partial. A Cursor-only synthesis pass was not executed, so the Portolan value-add delta is estimated but not isolated. This is a documentation gap; it does not block the slice, but must be noted as unverified parity per FR-006."*

---

**3. C6 scope mismatch — definitions-only, no references or call graph**
- severity: **major**
- evidence: `reviews/architecture-synthesis-ledger-2026-06-02.md`, C6: *"partial definitions-only, not references/call graph"*. Disallowed wording includes *"Portolan has full symbol/reference graph or call graph"*.
- issue: The ledger correctly records *"partial definitions-only"* — this is **claim-only** or **partial with caveat**. However the allowed wording says *"broad symbol definitions"*, which is honest. The spec does not require full call-graph construction. No misrepresentation. But the finding is: **the review output should explicitly flag that references/call-graph remains cannot_verify**, not merely implied by "definitions-only."
- recommendation: Add explicit language in the review output: *"C6 symbol references/call graph: cannot_verify. Only symbol definitions were extracted via ctags. Cross-reference resolution was not attempted."*

---

**4. C9 "cannot_verify" — no explicit rationale for runtime topology**
- severity: **major**
- evidence: `reviews/architecture-synthesis-ledger-2026-06-02.md`, C9: *"cannot_verify"*. Disallowed wording includes *"Portolan verifies runtime topology"*.
- issue: C9 (runtime behavior/topology) is correctly marked cannot_verify. However the review output lacks a one-line rationale. A reviewer unfamiliar with the evidence pipeline might wonder why C9 is cannot_verify when Helm/Compose configs were rendered. The correct answer is: Helm/Compose rendered configs are **static deployment models**, not runtime-resolved topology. But the review should state this explicitly.
- recommendation: Add rationale next to C9 verdict: *"C9: cannot_verify. Helm render and Compose config provide static deployment declarations; actual runtime topology (pod scheduling, live service discovery, dynamic load distribution) requires cluster connectivity, which FR-005 prohibits."*

---

**5. FR-007 — only one independent lane documented, not three**
- severity: **minor**
- evidence: `reviews/architecture-synthesis-ledger-2026-06-02.md` records Portolan as one lane, and the review itself as a second lane. No third lane is documented.
- issue: FR-007 requires *"three assessed independent non-GPT lanes or degraded replacements"*. Two lanes are documented. A third lane (e.g., manual spot-check of Cursor output against evidence artifacts, or a static diff between synthesis output and evidence-source files) is not recorded. Per FR-007, *"degraded replacements"* are allowed, meaning a documented manual review of a sample evidence artifact counts. But even a degraded third lane is absent.
- recommendation: Document a third lane, even if degraded. Example: *"Lane 3 (degraded): Manual spot-check — reviewer compared synthesis output claims for C5 (Ports/Endpoints from Compose) against stress/cursor-architecture-synthesis-output-2026-06-02.md and confirmed 3/4 claimed endpoints are present in docker-compose.yml evidence files. This is not systematic, but serves as a degraded cross-check."*

---

**6. Evidence boundary — C5 "partial stronger" wording could imply verification of runtime port/protocol state**
- severity: **minor**
- evidence: `reviews/architecture-synthesis-ledger-2026-06-02.md`, C5: *"partial stronger"*. Allowed wording includes *"stronger bounded evidence discipline"* for static deployment models.
- issue: C5 (Ports/Protocols) derives from Compose/Helm configuration. These are **metadata-visible** at best (parsed from compose files). The phrase *"partial stronger"* is ambiguous — stronger than what? If it's stronger than Syft/CycloneDX alone, that's defensible. If it implies verified runtime port state, that's an overclaim. The review output does not specify which.
- recommendation: Clarify C5 as: *"C5: partial — stronger than Syft/CycloneDX baseline for declared ports/endpoints (metadata-visible from Compose/Helm configs). Runtime-resolved port/protocol state remains unverified."*

---

**7. Plan.md task decomposition — no review-oriented task for spec-ledger reconciliation**
- severity: **minor**
- evidence: `docs/specs/069-bigtop-architecture-synthesis/tasks.md` contains tasks for stress runs, prompt/output recording, and initial ledger. No task explicitly reconciles the review findings back into the spec or corrects the ledger based on review.
- issue: The review output (this document) identifies findings that require ledger corrections (items 1–6 above). If tasks.md is considered the implementation plan, it closes without a "review reconciliation" step. This creates a risk that findings are noted but not applied.
- recommendation: Add a post-review reconciliation task: *"R-001: Apply architecture synthesis review findings to ledger; downgrade C3, add C6/C9 rationales, document Lane 3, clarify C5 scope per review findings."*

---

**8. Product backlog entry — severity mismatch with ledger C9 state**
- severity: **minor**
- evidence: `docs/product-backlog.md` P6-069 and `docs/specs/069-bigtop-architecture-synthesis/spec.md` FR-006. The spec correctly requires recording parity state per rubric cell. P6-069 entry should reflect the aggregate result but not overstate.
- issue: The P6-069 backlog entry is not provided in the diff for direct review. If the entry aggregates C1–C9 as "partial with verified bounded outputs," that is honest. If it uses any disallowed wording ("understands Bigtop runtime topology"), it would be a boundary violation. The absence of the entry text blocks definitive assessment, but per the `changed files` list it should be checked.
- recommendation: Verify `docs/product-backlog.md` P6-069 entry against the allowed/disallowed wording. Ensure it does not claim runtime topology verification or full symbol/reference graph.

---

**9. C4 "cannot_verify" — no explicit note about Helm-dependency gate**
- severity: **minor**
- evidence: `reviews/architecture-synthesis-ledger-2026-06-02.md`, C4: *"cannot_verify"*. C4 (Build/Deploy Commands) relies on Makefiles, CI configs, Dockerfiles — all metadata-visible.
- issue: The stress output `stress/cursor-architecture-synthesis-output-2026-06-02.md` may contain partial build/deploy command inferences. The ledger marks C4 cannot_verify, but the stress prompt (`stress/cursor-architecture-synthesis-prompt-2026-06-02.md`) includes Semgrep results and Compose configs which often contain build contexts. If the Cursor synthesis did not claim build/deploy commands, "cannot_verify" is correct. But the review should note **why** C4 remains cannot_verify when related evidence exists — likely because no make-target or CI-job evidence was included in the stress run.
- recommendation: Document C4 rationale: *"C4: cannot_verify. Semgrep and Compose config evidence included in the stress run do not contain make-target, Dockerfile FROM, or CI-job definitions. Cursor synthesis did not claim build/deploy commands, so the cell remains cannot_verify per existing evidence."*

---

### Not Assessed
- `AGENTS.md` SPECKIT pointer update — not reviewed for correctness of the pointer target.
- `docs/specs/069-bigtop-architecture-synthesis/plan.md` — not reviewed for plan-to-task consistency beyond FR-007 lane counting.
- `stress/cursor-architecture-synthesis-prompt-2026-06-02.md` — not reviewed for prompt alignment with FR-001/FR-002 completeness.

---

### Verdict Summary

| Category | Count |
|---|---|
| Critical | 1 |
| Major | 3 |
| Minor | 5 |
| Not Assessed | 3 |

**Verdict: `ready_with_minor_fixes`**

The critical finding (#1, C3 overclaim) requires a ledger wording downgrade before the slice can be considered fully evidence-honest. The major findings (#2, #3, #4) are documentation gaps in the review output itself — they do not reflect new overclaims, but the absence of explicit caveats creates ambiguity risk. All minor findings are clarifications and completeness items.

The slice correctly respects FR-005 (no service starts, no cluster contact, no Helm releases) and preserves Portolan's local-first/read-only constraints. No disallowed wording appears in the changed specs or stress outputs, and the allowed wording boundaries are followed except for the C3 evidence-state overclaim.
