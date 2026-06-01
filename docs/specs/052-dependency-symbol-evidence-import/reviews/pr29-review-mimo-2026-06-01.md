Looking at this PR review packet carefully, I need to assess the implementation of spec 052 against the stated requirements and constitution constraints.

---

## PR 29 Review: Dependency/Symbol Evidence Import

### Findings

#### Critical
None.

#### Major

1. **Test coverage gap for boundary cases** — The spec explicitly calls out preserving malformed, empty, oversized, or unsupported producer output as `cannot_verify`, and missing families as `not_assessed`. The review packet lists `internal/selection/selection_test.go` as a new file but provides no summary of what edge cases are actually tested. Given the size caps (`64 MB`, `5000 documents`, `50000 symbols`) and the two distinct producer families (dependency/SBOM vs. symbol-index), I'd expect at minimum:
   - Oversized input → `cannot_verify`
   - Empty input → `cannot_verify`
   - Malformed JSON/CycloneDX → `cannot_verify`
   - Missing producer family → `not_assessed`
   - Valid CycloneDX with missing dependency refs → `cannot_verify` on those refs
   - Valid symbol-index producing only `owns` edges with the stated reason string

   **Action required:** Confirm these cases exist in `selection_test.go`. If any are missing, add them before marking ready-for-review.

2. **Symbol-index edge reason string not contract-tested** — The spec says edges state "not a complete call graph." This is a semantic guardrail: it prevents downstream consumers (and future contributors) from treating the imported edges as a call graph. If the exact reason string isn't asserted in a test, it can drift silently. **Action required:** Add or confirm a test that asserts the edge `reason` field equals `"not a complete call graph"` (or whatever the exact literal is).

#### Minor

1. **`maxSelectedToolOutputBytes` is an `int64` constant but not configurable** — 64 MB is reasonable for the current use cases, but since this is a hard ceiling that silently converts overflow to `cannot_verify`, consider logging or annotating the finding with the actual byte count so a user can diagnose why evidence was dropped. Not a blocker.

2. **Syft OSS-plan exclude paths are hardcoded** — `./.portolan/**` and `./run/**` are specific to the current stress-artifact layout. This is fine for now, but worth a comment in the code noting these are stress-artifact exclusions that may need revisiting if the directory layout changes.

3. **Draft status and merge state** — The PR was `UNSTABLE` at creation but is now `CLEAN` with all GitHub checks passing. The transition is clean. No issue here, just noting it for the record.

4. **Docs coverage** — `docs/specs/052-dependency-symbol-evidence-import/**` is added. The review packet doesn't enumerate what's inside. Assuming it covers the normalization rules and boundary behavior per the spec, this is adequate. Minor concern only if the spec prose doesn't document the `cannot_verify` / `not_assessed` semantics explicitly.

---

### Review Questions Answered

| # | Question | Answer |
|---|----------|--------|
| 1 | Evidence-state honesty preserved? | **Yes, by design.** `not_assessed` for missing producers, `cannot_verify` for malformed/oversized/empty, `source-visible` for context candidates, `metadata-visible` for imported evidence. No state is invented or collapsed. |
| 2 | Native PHP/JVM/Scala or runtime topology claimed? | **No.** The PR explicitly updates guidance to avoid these claims, and symbol-index imports are bounded to `owns` relationships with a "not a complete call graph" disclaimer. |
| 3 | Local-first/read-only and output-safety boundaries? | **Yes.** No network calls, daemons, or target mutation described. Size caps prevent runaway memory use. Syft excludes prevent contaminating evidence with old stress artifacts. |
| 4 | Tests and docs sufficient? | **Conditionally.** Major finding #1 and #2 above need confirmation. If the boundary cases and reason-string assertions are present, sufficient. If not, they must be added. |
| 5 | Blockers before ready-for-review? | **One conditional blocker:** confirm or add the missing boundary-case tests identified in findings #1 and #2. |

---

### Verdict

**`pass_with_changes`**

### Readiness Recommendation

**Draft stays draft** until the two major findings are resolved:
1. Confirm `selection_test.go` covers the full set of `cannot_verify` and `not_assessed` boundary cases.
2. Confirm or add a test asserting the exact `reason` string on symbol-index `owns` edges.

Once those are verified or added, the PR is ready to move to **ready-for-review**. The implementation is architecturally sound, evidence semantics are correctly preserved, and the safety boundaries hold.
