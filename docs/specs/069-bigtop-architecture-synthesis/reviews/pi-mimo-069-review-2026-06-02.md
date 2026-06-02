**Spec Review: docs-only SpecKit slice 069 — Bigtop Architecture Synthesis**

---

### findings:

- **severity:** critical
  **evidence:** spec.md requirement: "produce three assessed independent non-GPT lanes or replacements"
  **issue:** Only two of three required lanes yielded assessable output (DeepSeek, GLM). Kimi was excluded ("off-task…requested tools") and no replacement lane is documented as substituted. The requirement is "three assessed independent non-GPT lanes or replacements." There is no record that a replacement was run, evaluated, or that the requirement was formally re-scoped.
  **recommendation:** Either (a) run a third lane (e.g., Qwen, Yi, Mistral, or another non-GPT model) on the same prompt and record output/evidence-state, (b) document an explicit replacement lane with rationale in tasks.md or plan.md, or (c) downgrade the requirement from "three" to "two assessed lanes" with justification that two constitutes sufficient independent coverage for a docs-only stress slice. Until resolved, C9 ("cannot_verify" on full call/reference graph) cannot be strengthened by independent corroboration, and the slice cannot close its own acceptance gate.

- **severity:** major
  **evidence:** C4 "cannot_verify" and C9 "cannot_verify" in Cursor output scoring
  **issue:** Two of nine criteria remain at `cannot_verify` after the slice's evidence accumulation. The spec's goal is to "accumulate 059-068 evidence against C1-C9 before stronger architecture claim." If two criteria are unresolvable by docs-only means, this should be explicitly bounded rather than left as open `cannot_verify` — otherwise the ledger's "materially stronger bounded evidence discipline" claim is weakened by unacknowledged gaps.
  **recommendation:** Add explicit bounded statements to the ledger for C4 and C9: e.g., "C4: runtime topology verification requires live runtime probe; docs-only slice cannot resolve; deferred to runtime slice" and "C9: full call/reference graph requires graph-analysis tooling beyond composer output; bounded to API/catalog surface only." This converts `cannot_verify` into honest `unknown` with a reason, which is the Portolan-correct evidence state.

- **severity:** major
  **evidence:** Kimi lane exclusion rationale: "off-task…requested tools"
  **issue:** A lane requesting tools is an expected failure mode for a docs-only slice that explicitly prohibits runtime/service actions. Recording "off-task" without analyzing *why* (prompt design? model behavior? missing tool-availability guard?) means the slice loses a potential signal about prompt robustness. Additionally, "not assessed" conflates "could not run" with "ran but produced no usable output."
  **recommendation:** Reclassify Kimi as "attempted — prompt-incompatible" with a brief note (e.g., "model invoked tool-request pattern despite no-tool instruction; indicates prompt needs explicit no-tool preamble for this model family"). If a replacement was not run, this also feeds into the critical finding above.

- **severity:** minor
  **evidence:** Ledger allowed/disallowed wording; tasks.md T008-T012 pending
  **issue:** T008-T012 are pending but the finding does not specify which pending tasks gate the verdict vs. which are aspirational. If any pending task produces ledger content or evidence-state changes, the slice is not yet complete enough to close.
  **recommendation:** Add a completion note to tasks.md distinguishing "must complete before slice close" (e.g., ledger finalization, evidence-state audit) from "can defer to next slice." If all pending tasks are deferral-eligible, state so explicitly.

- **severity:** minor
  **evidence:** plan.md: "no…public claim updates"; spec.md: "record parity state"
  **issue:** "Parity state" is referenced but the packet does not include the actual parity record (what is at parity with prior slices, what regressed, what improved). Without seeing the parity artifact, a reviewer cannot confirm the slice preserved continuity.
  **recommendation:** Ensure the parity-state document (or section within tasks.md/ledger) is included in the slice's deliverables. If it exists but was not in the packet, flag for inclusion in the review handoff.

---

### not_assessed:

- Actual content of the Cursor composer-2.5 prompt/output (the packet summarizes scores but does not include raw output; I cannot verify the scoring judgments themselves — this is `claim-only` without seeing the artifact).
- Whether the "three independent lanes" requirement includes or excludes the Cursor lane itself (ambiguity: does Cursor count as one of three, or are three non-GPT lanes required *in addition to* Cursor?).
- GLM and DeepSeek lane output quality beyond the summary labels ("documentation findings," "overclaim/clarification findings") — no raw output to review.

---

### verdict: **blocked**

Two blocking conditions:

1. **Lane count shortfall** — the three-lane requirement is not demonstrably met; no replacement is documented.
2. **Unresolved cannot_verify states** — C4 and C9 remain at `cannot_verify` without explicit bounding or deferral rationale, which undermines the slice's own evidence-discipline claim.

Once these are addressed (either by adding a third lane or formally re-scoping, and by converting C4/C9 to bounded `unknown` with deferral reasons), the slice moves to `ready_with_minor_fixes` pending the minor findings on task gating and parity-state inclusion.
