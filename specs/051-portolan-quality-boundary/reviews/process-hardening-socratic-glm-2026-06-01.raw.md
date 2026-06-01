## Socratic Review

### 1. Command timeout + off-task detection (SKILL.md hunk 1, benchmark hunk)

These address real failure modes you've hit: hung lanes, lanes that emit harness instructions instead of verdicts. Fair.

**Challenge:** "run an explicit enabled non-GPT replacement" — is "non-GPT" a material property here, or is the real requirement *an enabled model that actually completes*? If the roster is reconfigured tomorrow and GPT-4o becomes the only enabled model, does this rule forbid using it as a replacement? If so, it's overfit to today's roster. If not, the "non-GPT" qualifier is bureaucratic noise — "an explicit enabled replacement lane" says everything needed.

**Challenge:** The benchmark hunk repeats the SKILL hunk almost verbatim (off-task output, timeouts, malformed packets). If both must say the same thing, one is redundant. If one is normative (skill) and the other is benchmark guidance, the overlap is a coherence risk — they will drift. Pick one authoritative location and reference it.

### 2. Shell packet verification (SKILL.md hunk 1, benchmark hunk)

Good hygiene — a prompt with literal `$(cat ...)` is not review evidence. No objection.

**Minor:** "must be retried or recorded as `not_assessed`" — these are different outcomes. Retry costs time and may still fail. When is retry mandatory vs. just recording failure? If the answer is "always retry once," say that. If it's "operator discretion," don't imply obligation with "must."

### 3. PR scope hygiene (SKILL.md step 6)

Real problem (spec bleed from a shared local base). The fix is minimal.

**Challenge:** "remove unrelated backlog/spec files from the PR" — by what mechanism? `git rebase -i`? `git reset HEAD^ -- <paths> && git commit --amend`? The instruction tells *what* but not *how*, and a wrong `rebase` can reorder review evidence. One sentence on the intended mechanism would close this. Or: if the agent is expected to know git, drop the step-level detail entirely and just say "PR scope must contain only files relevant to the spec being delivered."

### 4. Stale green-checks (SKILL.md hunk 3)

Correct and important. No objection.

---

## Verdict: **CHANGES_REQUESTED**

**Objections:**

1. **"non-GPT" qualifier is overfit.** Replace with "enabled replacement lane" unless you have a permanent structural reason to exclude GPT-family models from the replacement pool.
2. **Normative duplication between SKILL.md and benchmark doc.** The three new rules appear in both places with near-identical wording. Choose one authoritative location; the other should reference it, not copy it.
3. **"must be retried or recorded" is ambiguous.** Clarify: is a single retry mandatory before recording `not_assessed`, or is recording without retry acceptable?

**Improvements (non-blocking):**

- Step 6 (PR scope): either name the git mechanism or simplify to a single scope-correctness assertion and trust the agent's git knowledge.
- "not_assessed" is now a catch-all for: timeout, off-task, malformed packet, hung. Consider a short taxonomy so post-hoc analysis can distinguish these without reading raw output.
