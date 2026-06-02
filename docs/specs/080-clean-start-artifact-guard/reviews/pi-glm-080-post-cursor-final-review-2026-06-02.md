## Portolan PR #58 — Spec 080 Post-Cursor Stress Update Review

### Findings

| # | Severity | Area | Finding | Evidence |
|---|----------|------|---------|----------|
| 1 | **minor** | Spec status wording | `spec.md` status says "in progress" — accurate for open tasks but slightly ambiguous about whether the *diff itself* is reviewable. Cosmetic only. | `Status: PR #58 post-Cursor stress update in progress` |
| 2 | **minor** | Evidence index scrub completeness | The test only asserts presence of `"status":"not_assessed"` once for two records. A degenerate scrub bug on the *second* record could pass if the first record's fields are correct. Low risk; the records share the same code path. | Test checks `strings.Contains` for shared substrings, not per-record JSONL parsing. |
| 3 | **minor** | `not_assessed` count in brief | `agent-brief.md` summary line counts `verified` + `not_assessed` but ignores other statuses (e.g., `failed`, `cannot_verify`). Current test data includes a `failed` record that is correctly downgraded to `not_assessed`, so the output is accurate now, but the counting loop silently drops anything not in those two buckets. | `switch` in brief render only increments `verified` or `not_assessed`; total count comes from `len(producerRuns)`. |
| 4 | **none (observation)** | Scope boundary honesty | Cursor stress unknowns table is exemplary — clearly states agent obedience is `cannot_verify`, not `not_assessed`. Review disposition correctly propagates this to `not_assessed` section. No action needed. | Cursor stress output Unknowns table; disposition `not_assessed` section. |
| 5 | **none (observation)** | Stale path coverage | `isStaleSiblingStressOutput` correctly handles: empty path, non-stress output, current run's own output, and non-stress `out` path (returns false). Edge case: if `out` is *inside* `.portolan/stress` but `Rel` produces a single-component prefix (e.g. `out` = `<root>/.portolan/stress`), `currentStressRunRoot` returns `(stressRoot, true)` which is correct — the entire stress tree becomes current. | `currentStressRunRoot` logic with `parts[0]` extraction. |

### Requirements Fit

| Requirement | Status | Evidence |
|------------|--------|----------|
| FR-001 (forbidden paths in guidance) | ✅ pass | `answer-contract.md`, `query-plan.md` generated and tested |
| FR-002 (contamination rule) | ✅ pass | Cursor stress confirmed no forbidden reads |
| FR-003 (no deletion) | ✅ pass | Prior stress roots remain; code is metadata-only |
| FR-004 (self-contained context) | ✅ pass | Cursor stress: 8 artifacts read, all under current context |
| FR-005 (map evidence isolation) | ✅ pass | No map in this context; prior outputs demoted |
| FR-006 (no new deps/mutation) | ✅ pass | Pure Go stdlib additions; `go vet` clean |
| FR-007 (stale sibling scrub) | ✅ pass | `not_assessed` downgrade, `path`/`output_path`/`command` scrubbed; `target_root` scrubbed when it points into sibling; test + Cursor stress confirm |
| SC-001 (guided discovery) | ✅ pass | Profile cursor; boundary in 3 generated files |
| SC-002 (no target deletion) | ✅ pass | Read-only metadata normalization |
| SC-003 (baseline checks) | ✅ pass | `go test ./...`, `go vet ./...`, `jq empty`, `git diff --check` |
| SC-004 (closeout separation) | ✅ pass | T020 still open; spec status reflects in-progress |
| SC-005 (Cursor stress) | ✅ pass | Cursor Composer 2.5 verified; status `verified`, no forbidden reads |

### Evidence-State Honesty

- Stale sibling producer-run records are `not_assessed` with scrubbed sensitive fields — **honest**.
- Prior `failed`/`cannot_verify` statuses are also downgraded, preventing false implication of recency — **honest**.
- `reason` field preserves the original status before downgrade — **traceable**.
- Cursor stress unknowns table does not overclaim — **honest**.
- `agent-brief.md` summary now shows `0 verified current` for the Bigtop pack — **honest**.

### Stale Path/Output Safety

- `isStaleSiblingStressOutput`: only triggers when `out` is under `.portolan/stress/<run>/…` and the candidate output is under a *different* stress run. Non-stress outputs are untouched. ✅
- `target_root` scrub is conditional on `isStaleSiblingStressOutput(root, out, targetRoot)` — only when target_root itself points into a sibling. ✅
- `outputPath` resolution is absolute before comparison — no relative-path escape. ✅
- Test fixture creates sibling `old-run` and current `current-run`; asserts `old-run`/stale paths absent from all generated artifacts. ✅

### Generated Agent Guidance

- `agent-brief.md`: current output path explicit, boundary section present, producer-run summary counts accurate. ✅
- `answer-contract.md`: fresh boundary rules, forbidden paths listed, contamination rule present. ✅
- `query-plan.md`: boundary confirmation step. ✅
- Centralized boundary text constants prevent drift (prior finding F-1 fix). ✅

### Tests

- `TestRunWritesFreshArtifactBoundaryGuidance`: covers stale sibling producer-run scrub, `not_assessed` downgrade, absence of stale paths from JSON artifacts, ambiguous summary rejection. ✅
- Evidence index assertions verify key substrings across both records. Adequate for this scope; minor weakness noted (finding #2).
- No regression in existing contextprep tests per `go test ./...`. ✅

### Regression Risk

**Low.** Changes are isolated to `detectProducerRuns` → `producerRunEvidenceRecord` path and `renderAgentBrief` summary line. The scrub logic is additive (only downgrades, never upgrades). Non-stress contexts (where `out` is not under `.portolan/stress`) skip the scrub entirely via `currentStressRunRoot` returning `false`.

### Recommendation

Ship with the open task T020 (baseline refresh, push, GitHub check). The finding #3 minor (status count coverage) is a future-hardening note, not a blocker.

### Verdict

**Pass with minor observations.** FR-007 is correctly implemented, tested, and verified by Cursor Composer 2.5 stress. Evidence-state honesty is maintained. No critical or major findings.

### Not Assessed

- OpenCode obedience to the guard
- Arbitrary agent obedience outside the bounded Cursor prompt
- GitHub review approval and merge readiness
- Full independent re-review of the updated diff
- Future 076 parity execution
