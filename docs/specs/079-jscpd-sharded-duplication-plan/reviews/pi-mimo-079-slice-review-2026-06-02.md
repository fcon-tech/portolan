**Review: jscpd Sharded Duplication Plan (Spec 079)**

---

### Findings

**F1 – Test uses `assertWritesUnderContextToolOutput` for shard output paths**
- **Severity**: Major
- **Evidence**: In `TestRunAddsShardedJSCPDCommandsForMultipleRepositories`, the call `assertWritesUnderContextToolOutput(t, command.Writes, plan.ToolOutputDir)` checks that writes stay under the context output directory. However, the test also checks `strings.Contains(command.Writes[0], filepath.Join("tool-outputs", "jscpd"))`. This is fine semantically, but the assertion function name `assertWritesUnderContextToolOutput` is ambiguous about whether it enforces the *sharded* subdirectory structure (`jscpd/<repo-id>/`). The test passes only because the hardcoded `filepath.Join("tool-outputs", "jscpd")` check catches it, but `assertWritesUnderContextToolOutput` itself may not enforce shard-level containment. If another tool writes under `tool-outputs` without a shard subdirectory, the generic check would pass but the sharding contract could be violated.
- **Recommendation**: Either rename/extend the assertion to `assertWritesUnderJSCPDShardOutput` or add an explicit check that `command.Writes[0]` contains `filepath.Join("tool-outputs", "jscpd", safeID(repo.ID))` for the specific repos. This makes the test self-documenting and prevents regression if the shard output path structure changes.

**F2 – `jscpdCommand` uses `outputDir` for `Args` but `outputFile` for `Writes`; mismatch risk if jscpd changes behavior**
- **Severity**: Minor
- **Evidence**: In `jscpdCommand`, `Args` passes `--output` as `outputDir` (the directory), while `Writes` lists `outputFile` (the specific file). jscpd's `--reporters json` with `--output` as a directory creates `jscpd-report.json` inside that directory. The `Writes` slice correctly lists the final file path, but if jscpd ever changes its output filename convention, the `Writes` claim would become stale. This is a documentation/hygiene concern, not a functional bug.
- **Recommendation**: Add a comment in `jscpdCommand` noting that `Writes` assumes jscpd's default `jscpd-report.json` filename within the output directory. Consider deriving `outputFile` from `outputDir` plus the known filename constant to keep them in sync.

**F3 – `sortedRepositoriesForPlan` copies slice but `append([]Repository(nil), repos...)` allocates even for empty input**
- **Severity**: Minor
- **Evidence**: `sortedRepositoriesForPlan` is called only when `len(repos) > 1`, so this is never hit with an empty slice in practice. However, the defensive copy pattern `append([]Repository(nil), repos...)` is idiomatic and safe. No functional issue.
- **Recommendation**: No action needed; this is idiomatic Go.

**F4 – Guidance text in `answer-contract.md` and `query-plan` is untested for single-repo edge case**
- **Severity**: Minor
- **Evidence**: The added guidance says "Run repository-sharded jscpd commands sequentially on large multi-repo landscapes." For a single-repo context, this guidance is still present but technically inaccurate (there is only one command, not multiple "shards"). The `TestRunAddsShardedJSCPDCommandsForMultipleRepositories` test only covers the multi-repo case. There is no test asserting that single-repo contexts do *not* contain the sharding guidance.
- **Recommendation**: Add a focused test for a single-repo context verifying that the `answer-contract.md` does not mention "sharded" or that the jscpd plan reason does not reference "repository shards." This prevents agents from receiving misleading guidance on simple projects.

**F5 – `repos` parameter passed to `buildOSSPlan` but only used by `jscpdPlan`; other plans ignore it**
- **Severity**: Minor
- **Evidence**: `buildOSSPlan` now takes `repos []Repository` as a parameter, but only `jscpdPlan` uses it. `syftPlan` and `semgrepPlan` still take only `inputPresent bool`. This is a clean separation for now, but if future plans need repository awareness, the function signature will need to grow again.
- **Recommendation**: No immediate action. If more tools need repo-awareness, consider passing a `planContext` struct instead of expanding positional parameters.

**F6 – `evidence-state honesty` is preserved: no jscpd execution, no metric synthesis**
- **Severity**: N/A (positive finding)
- **Evidence**: The diff confirms `plan.Status = "available_not_run"` and `plan.EvidenceState = "not_assessed"` are set before any commands are appended. The plan does not execute jscpd, does not install stores/plugins, and does not synthesize duplication metrics. The guidance explicitly states "missing, failed, or unrun shards remain not_assessed/failed and must not be aggregated into duplication metrics." The Bigtop smoke confirms `tool-outputs` directory was absent after the run.
- **Verdict**: Evidence-state honesty is maintained.

**F7 – `MutatesTarget: false` and `RequiresUserApproval: true` are correct**
- **Severity**: N/A (positive finding)
- **Evidence**: All jscpd commands set `MutatesTarget: false` (reads only) and `RequiresUserApproval: true`. The test asserts this. `Network: "not_expected"` is also set. This preserves the local-first/read-only boundary.

**F8 – `--exitCode` and `--store` are correctly excluded from args**
- **Severity**: N/A (positive finding)
- **Evidence**: The test explicitly checks that args do not contain `--store` or `--exitCode`. The `boundedJSCPDArgs` function does not include them. This prevents agents from forcing native exit-code overrides or using jscpd's internal store.

---

### Not Assessed

- **Actual jscpd shard execution**: Not performed; the feature intentionally defers this to operators/agents after context preparation.
- **Cross-repository clone detection**: Explicitly `not_assessed` in the plan; no producer covers this yet.
- **Spec 076 Cursor parity validation**: Not in scope for this slice.
- **Node.js memory behavior under sharded runs**: The spec acknowledges that jscpd can still OOM per shard, but this is not tested. The plan correctly preserves `failed` state for such cases.

---

### Verdict

**Pass with two actionable findings (F1 major, F4 minor).**

The implementation correctly delivers repository-sharded jscpd commands, preserves evidence-state honesty, maintains the read-only boundary, and includes thorough test coverage for the multi-repo case. The Bigtop smoke confirms real-world correctness.

**F1** (major): The generic `assertWritesUnderContextToolOutput` does not self-document the shard-level output contract; the test relies on a secondary hardcoded check to catch this. Tightening the assertion prevents silent regression.

**F4** (minor): No test covers the single-repo guidance text, which could mislead agents on simple projects.

All other findings are minor hygiene observations or positive confirmations. No critical issues found.
