### Review Findings: Spec 056 Bigtop Architecture Understanding

**Reviewer:** Pi agent (review-only; no file reads or tool execution performed).

---

#### Critical

None.

#### Major

1. **`verified` status on Q1 is slightly strong for the evidence described.**
The Portolan output itself scopes Q1 as "within the bounded 18-repo corpus" and flags `gap-external-completeness` as `unknown`. The acceptance ledger maps this to `verified (scoped)`, which is internally consistent—but the word `verified` reads as a stronger claim than the evidence supports when reused outside this packet. Recommendation: in any downstream product or spec artifact, always carry the `(scoped)` qualifier or downgrade to `partial` with an explicit scope note, to avoid accidental overreach.

2. **Q8 is `partial` but the acceptance ledger row says "at least five questions," not "all nine."**
The evidence correctly shows improvement on Q1–Q5 via producer-run IDs and gap attribution. However, Q6–Q7 remain equally blocked in both lanes, and Q9 remains `partial` in both. The delta claim ("improved on at least five") is honest, but the Q8 Portolan output column says "Verified for this bounded comparison: Portolan improved evidence discipline or gap attribution on at least five questions"—the word "Verified" there is a statement about Q8 itself, not a claim status. Minor wording collision; see Minor #1.

3. **No paired scoring ledger artifact is supplied, yet the acceptance result claims "Q8 partial."**
The Portolan output for Q8 explicitly states "A formal scored acceptance ledger comparing lanes is not in the supplied artifacts." The acceptance ledger in the packet *is* that ledger. This is fine—but the review packet should clarify that the acceptance ledger *is* the Q8 evidence artifact, not a separate document. Currently the Q8 "Supporting evidence" column references "This ledger; both bounded Cursor outputs," which is self-referential but acceptable. No action required if intentional.

#### Minor

1. **Wording collision in Q8 Portolan output: "Verified for this bounded comparison."**
The word "Verified" here is used as a prose assertion ("we verified that Portolan improved…"), not as a claim-status field value. The actual claim-status is `partial`. This could confuse downstream consumers who scan for the word `verified`. Suggested edit: "Confirmed for this bounded comparison: Portolan improved…" to avoid ambiguity.

2. **`jq empty schema/*.json passed`—schema files not listed in changed files.**
The verification run includes JSON schema validation, but no `schema/*.json` files appear in the diff. Either they are unchanged (valid) or the check is a no-op on this slice. Acceptable, but worth noting for completeness.

3. **`go test -count=1 ./...` and `go vet ./...` passed—no Go source changes in the diff.**
Same observation: the verification run is precautionary, not directly exercised by this slice. Acceptable for CI hygiene.

4. **Disallowed wording list is well-formed but not formally enforced.**
The spec states disallowed product claims, but there is no automated lint or CI gate preventing them from appearing in future docs. Consider a grep-based CI check or a spec-level assertion if the spec matures.

5. **`git diff --check` passed—no whitespace issues.** Minor positive confirmation; no action.

---

### Verdict

**Accept with minor revisions.**

- **Claim overreach:** No critical overreach. Q1 `verified (scoped)` is the strongest claim; it is defensible within the bounded packet but should always carry the `(scoped)` qualifier downstream. All other claims are appropriately `partial` or `blocked/not_assessed`.
- **Requirements fit:** The 9-question rubric, bounded Cursor-only / Cursor-plus-Portolan comparison, and acceptance ledger align with the spec's purpose. The evidence-state discipline (producer-run IDs, gap records, explicit non-claims) is consistently applied.
- **Evidence-state honesty:** Gaps are explicitly named (`gap-runtime-observation-not-assessed`, `gap-symbol-index-not-assessed`, `gap-external-completeness`, etc.). No hidden inference or unstated runtime claims. The `metadata-visible` vs `runtime-visible` boundary is preserved.
- **Missing tests/checks:** No automated enforcement of disallowed product wording. Schema and Go checks are precautionary but not directly exercised.
- **`verified` strength:** Q1 `verified (scoped)` is the only claim approaching `verified`; all others are `partial` or lower. No `verified` status is unambiguously too strong given the explicit scope and gap qualifiers.

**Not assessed (by this reviewer):**
- Actual content of producer-run files, stress test outputs, spec.md internals, data-model.md, contracts/, research.md, plan.md, quickstart.md, tasks.md, reviews/—not read in this review.
- Runtime behavior of Portolan tooling itself.
- Whether the 18-repo corpus is the correct or complete Bigtop landscape.
