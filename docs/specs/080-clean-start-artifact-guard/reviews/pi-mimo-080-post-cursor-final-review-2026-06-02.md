## Final Review: Portolan PR #58 — Spec 080 Clean-Start Artifact Guard

**Verdict: PASS (ready for merge approval review)**

---

### Findings

**Critical: 0**

**Major: 0**

**Minor: 2**

**M-1** — `isWithinPathBoundary` uses `filepath.Rel` which can behave unexpectedly across symlinks or bind mounts. If `root` or `path` traverse symlinks, boundary checks could produce false positives/negatives. **Severity: minor.** Low surface area since stress directories are developer-controlled. **Recommendation:** Document this assumption or add a note; no blocking action needed for this slice.

**M-2** — `evidence-index.jsonl` retains the stale `source_artifact` field (pointing at the sibling stress `producer-runs.jsonl`). The scrubbed `path`/`output_path`/`command`/`target_root` fields are the primary stale-artifact risk, but `source_artifact` metadata still reveals the sibling run directory name. **Severity: minor.** The Cursor stress confirmed this field was used only as metadata citation, not as a direct read, and the spec scopes scrubbing to `path`, `output_path`, and `command`. Consistent with spec FR-007 wording but worth noting as a conscious design boundary.

---

### Evidence-State Honesty

✅ Spec FR-007 correctly defines the stale-sibling rule and the scrubbing surface.  
✅ `producerRunEvidenceRecord` downgrades `status`/`evidence_state` to `not_assessed`, scrubs `path`/`output_path`/`command`, conditionally scrubs `target_root`, and appends an audit reason.  
✅ `renderAgentBrief` now counts `verified` vs `not_assessed` producer-run statuses rather than using the prior ambiguous wording.  
✅ `testify` assertions are per-JSONL-record, covering both the `verified` and `failed` stale records — addresses the earlier GLM test-gap finding.  
✅ The `not_assessed` scope boundary items honestly distinguish what was tested (bounded Cursor Composer 2.5 lane) from what was not (arbitrary agent obedience, filesystem guarantees).

### Stale Path/Output Safety

✅ `isStaleSiblingStressOutput` checks that `outputPath` is inside `<root>/.portolan/stress` but outside the current stress run root derived from `out`.  
✅ `target_root` is scrubbed only when it itself points into a sibling stress root — preserves the design decision from GLM M1/M4 fix.  
✅ Bigtop smoke verification: `rg` for `20260601-054-initial-proof` returned no matches in the fresh context pack.  
✅ Cursor stress confirms: "path and command fields were scrubbed to avoid stale artifact reuse (`evidence-index.jsonl` lines 90–92)" and no forbidden paths were opened.

### Generated Agent Guidance

✅ `agent-brief.md` summary line changed from ambiguous "`verified` records describe externally generated outputs" to concrete counts: `N (X verified current records; Y not_assessed; Portolan did not execute them)`.  
✅ Test `TestRunWritesFreshArtifactBoundaryGuidance` explicitly asserts the new summary format and fails if the old ambiguous wording persists.  
✅ `answer-contract.md` and `query-plan.md` boundary text is centralized via constants — no drift risk.

### Tests

✅ `go test ./internal/contextprep` — pass  
✅ `go test ./...` — pass  
✅ `go vet ./...` — clean  
✅ `jq empty schema/*.json` — valid  
✅ `git diff --check` — clean  
✅ Per-record JSONL assertions in test catch both stale records individually.  
✅ `readEvidenceIndexContextprep` helper parses and indexes records by ID for structured field checks.

### Regression Risk

✅ The change is additive to `detectProducerRuns` (new `out` parameter passed through). All existing call sites are internal; the public `Run` signature is unchanged.  
✅ Non-stale producer-run records are unaffected — the `isStaleSiblingStressOutput` guard returns `false` early when `outputPath` is empty or outside the stress root.  
✅ The `appendReason` helper is safe for empty-initial-reason cases.  
✅ No target mutation, deletion, network access, or new dependencies introduced.

### Disposition Table Consistency

✅ All three accepted-and-fixed items from `slice-review-disposition-2026-06-02.md` are reflected in code changes, test changes, and review documentation.  
✅ Spec `SC-005` success criterion is met by the Cursor stress lane evidence.  
✅ `not_assessed` items are honestly scoped: OpenCode, arbitrary agent obedience, GitHub approval, merge readiness, spec 074 parity.

---

### Recommendation

**Approve for merge.** The two minor findings are non-blocking and consistent with the spec's stated design boundaries. The PR completes spec 080's scope: guidance-only artifact boundary, stale producer-run metadata normalization, and a verified Cursor Composer 2.5 stress lane confirming the guard works as designed.
