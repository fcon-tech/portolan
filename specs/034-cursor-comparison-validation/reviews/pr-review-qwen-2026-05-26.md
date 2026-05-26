Now I have the full PR diff, comparison ledger, raw outputs, prompts, PR review artifacts, and backlog row. Here are my findings as a read-only reviewer.

---

## PR #14 Review Findings: 034-cursor-comparison-validation vs origin/main

### Finding R1 — Major: Lane B1 output contradicts the "bounded-artifact-only" requirement

**File**: `specs/034-cursor-comparison-validation/reviews/cursor-plus-portolan-output.md`

The B1 lane output references **findings.jsonl** (line 106: "283 duplication findings") and **graph-index.json relationship finding samples** that appear to have been read as bulk artifacts, not as targeted graph slices. The spec FR-009 and plan strictly require the assisted lane start from context pack + `summary.json` + `graph-index.json`, loading graph slices *only when needed*. The ledger lane-input block (comparison-ledger-2026-05-26.md, the `cursor-plus-portolan` JSON block) records only three artifact paths and omits `findings.jsonl` or individual slice files, but the raw output quotes finding counts and samples that could not be derived from `summary.json` and `graph-index.json` alone without loading the findings JSONL.

**Evidence**: The output cites "283 duplication findings", "269 duplication graph nodes", "88 source code duplication findings", specific file-level duplicate examples (log4j.properties, webhook YAML, vagrant/ansible scripts), and 136 runtime/configuration surface findings. These granular counts require either findings.jsonL ingestion or a targeted graph slice — neither appears in the ledger's `input_artifacts` list.

**Risk**: If the B1 lane loaded findings.jsonl as a bulk input, it violates FR-009 and the bounded-first discipline. The ledger input artifacts underreport what the agent actually consumed.

**Recommended fix**: Either (a) verify that all cited finding counts and samples are present in `summary.json` and `graph-index.json` as aggregated totals, or (b) re-run the B1 lane with strict bounded inputs and record findings.jsonl as an input artifact if it was consumed.

---

### Finding R2 — Minor: PR diff includes 21 binary files in the map bundle

**File**: Diff lines 180–228 in `+ .portolan/run/bigtop-map/*` paths; 21 binary entries shown as `[file mode change 0 → 100644]`

The PR carries a full map bundle snapshot under `.portolan/run/bigtop-map/` (binary JSONL, cache, and graph files). The spec plan says runtime outputs go to `/tmp` or an operator-selected directory. Committing a heavyweight binary map artifact snapshot into the PR diff obscures the actual 4,498 meaningful lines of text changes and increases review burden.

**Evidence**: `git diff --name-status origin/main...HEAD` shows 31 files under `.portolan/` added/modified, including 21 flagged as binary.

**Risk**: No correctness impact, but it makes the PR harder to audit and violates the plan's storage guidance.

**Recommended fix**: Exclude `.portolan/run/` from the PR via `.gitignore` or move the map bundle to an operator-selected path before commit. The ledger already records artifact paths and sizes — the raw binaries don't need to be versioned.

---

### Finding R3 — Major: Scored "0 unsupported claims" for B1 lane is inconsistent with B1's own self-reported `not_assessed`/`unknown` surface

**File**: `specs/034-cursor-comparison-validation/reviews/comparison-ledger-2026-05-26.md` (per-question score blocks for `cursor-plus-portolan`)

Every B1 lane question is scored with `"unsupported_claim_count": 0` and `"scope_correct": "yes"`. However, the B1 raw output itself reports an extensive surface of `not_assessed` (9+ categories, 118 findings, Java/Maven graph, production/runtime behavior, near-clone duplication, semantic config analysis, non-Go relationships, etc.) and `unknown` states (external ecosystem completeness). These are honest evidence states and don't *need* to be unsupported claims — but the scoring rubric must distinguish between a claim being *correctly bounded to unknown/not_assessed* (which is good evidence discipline) and a question where the answer is *incomplete* relative to the CTO question asked. For example, the "service-relationships" question asked about relationships; B1 answered "only Go imports are safe, everything else is not_assessed" — which has zero unsupported claims but also zero *useful* service-relationship answers beyond Go. Marking this 0 unsupported + scope_correct: "yes" hides the gap between evidence honesty and question coverage.

**Evidence**: B1 output line 63: "Only Go import edges... are safely stated" for service relationships. B1 output lines 98–108: 8+ categories marked unknown or not_assessed. Ledger scoring: all zeros for unsupported claims, all "yes" for scope_correct.

**Risk**: The 100% unsupported-claim reduction (12→0) looks clean but partially reflects B1's refusal to answer beyond its evidence boundaries rather than superior factual coverage. A product claim accepted on this delta overstates actual answer quality.

**Recommended fix**: Add a separate "coverage completeness" dimension to the scoring, or reclassify partial-answer-as-bounded-abstention as a distinct category from zero-unsupported-claim success. At minimum, the closeout should acknowledge that 0 unsupported claims is achieved partly by narrowing the answer surface, not solely by grounding every claim.

---

### Finding R4 — Minor: SpecKit lifecycle — analyze disposition precedes PR review, but PR review artifacts were produced by the same session

**File**: `specs/034-cursor-comparison-validation/reviews/pr-review-deepseek-2026-05-26.md` and `pr-review-qwen-2026-05-26.md`

Both PR review files report `empty / hung output` and `not_assessed` — they record that the review lane failed to produce findings rather than substantive independent review. The AGENTS.md requires at least two independent review lanes for PRs touching evidence semantics, path/output safety, schemas, or CLI behavior. When both lanes return `not_assessed`, the PR has no independent review evidence.

**Evidence**: Both PR review files exist but report empty output from their respective models.

**Risk**: The PR is marked ready-for-review with no actual accepted findings from either independent reviewer. This should be explicitly reported as a `not_assessed` review surface rather than implicitly treated as a clean review.

**Recommended fix**: The implementation closeout and PR readiness state should explicitly record both PR review lanes as `not_assessed` (already done in implementation-disposition but not in the backlog row for P4-034, which reads as if the spec is settled). Consider re-running review lanes or explicitly accepting the risk of proceeding without them.

---

### Finding R5 — Minor: Backlog row P4-034 text is informative but doesn't flag the absent review evidence

**File**: `docs/product-backlog.md`, P4-034 row

> "Accepted on fixed local Bigtop comparison for evidence discipline and next-action quality; UI Cursor/Composer, full ecosystem completeness, runtime topology, near-clone/SBOM duplication, and OSS producer execution remain not_assessed"

This accurately lists the product-surface not_assessed items but does not mention that *the PR review itself had two not_assessed lanes*. For a reader scanning the backlog, this reads as a settled spec rather than one accepted without independent review.

**Recommended fix**: Append a note that PR independent review lanes returned `not_assessed` and are a residual risk.

---

## Residual not_assessed risks (no findings):

1. **UI Cursor/Composer lane** — Only headless Cursor Agent was used; UI lane remains `not_assessed`.
2. **Full Apache Bigtop ecosystem completeness** — Local checkout of 18 repos ≠ full Bigtop corpus; correctness remains `unknown`.
3. **Independent PR review evidence** — Both review lanes returned empty output; `not_assessed`.
4. **GitHub checks** — CI/PR check state was not evaluated in this slice; `not_assessed`.
5. **Lane determinism** — A single run per lane cannot separate agent nondeterminism from systematic improvement; `not_assessed`.
