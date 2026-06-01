## Findings

### Major

1. **Unbounded slice allocation in `buildEvidenceIndex`**
   The `buildEvidenceIndex` function iterates over `candidates` but appears to operate on a `records` slice that is declared elsewhere in the function (not shown in the excerpt). While the total number of candidates is bounded by `relationshipCandidateScanLimitPerRepo × repos`, the snippet does not show an explicit cap or `make([]EvidenceRecord, 0, ...)` pre-allocation. If many repos are present (stress run: 18 repos → 30 candidates), this is safe in practice, but the code lacks defensive capacity hints for the broader function. **Minor risk** given observed scale, but worth a note.

### Minor

2. **`relationshipCandidateFamily` path-clean logic uses `filepath.ToSlash` then checks for `/src/rpm/` and `/specs/` — platform-correct, but no unit test for Windows-style paths**
   Since the stress run is Linux-only and Portolan targets Linux CI, this is acceptable but should be noted as `not_assessed` for cross-platform.

3. **`shouldSkipRelationshipCandidateDir` skips `.gradle` and `.idea` but not `.m2` or `out`**
   Repositories with Maven local caches (`.m2`) could inflate `scanned` count. Not a blocker — the per-repo scan limit caps exposure — but a minor inefficiency on polluted workspaces.

4. **Test excerpt checks family presence in `evidence-index.jsonl` but does not assert that `EvidenceState == "source-visible"` or `Status == "observed"` explicitly**
   The test verifies families exist and the answer-contract includes the producer-evidence boundary. The contract excerpt does include `source-visible` semantics. Adequate for PR, but strengthening the assertion would be a minor improvement.

5. **Answer-contract wording: "Dependency and symbol records from local producer outputs do not mean Portolan has native PHP, JVM, Scala, or other language semantics; they are producer evidence."**
   This is clear and correct. No issue; listed for completeness of the semantics plane.

---

## Detailed Verdict

### 1. Does this preserve source-visible candidate vs parsed metadata-visible relationship evidence?

**Yes.** The `EvidenceState` field is hardcoded to `"source-visible"` in `detectRelationshipCandidates`. The `Reason` field explicitly states "semantic parsing remains `not_assessed`." The answer-contract excerpt distinguishes `source-visible` / `metadata-visible` from `runtime-visible` and states that runtime topology remains `not_assessed`. The test asserts the answer-contract includes the producer-evidence boundary. **Pass.**

### 2. Any overclaim / service-topology / runtime / language-semantics issue?

**No.** Relationship candidates are emitted as `kind: "relationship-candidate"` with `EvidenceState: "source-visible"`. They are never promoted to parsed topology nodes or edges. The answer-contract explicitly warns that runtime communication is `not_assessed` unless runtime-visible observations are supplied. The stress run shows 106 `not_assessed` findings and 0 overclaims. Cursor Composer used the candidates without overclaiming. **Pass.**

### 3. Any bounded scanning / path / output safety issue?

**Bounded scanning:** The `relationshipCandidateScanLimitPerRepo` (20,000) caps file walks per repo. `shouldSkipRelationshipCandidateDir` skips common large dirs (`.git`, `node_modules`, `vendor`, `target`, `build`, `dist`, `generated`). Combined, this prevents runaway scans.
**Path safety:** Paths are derived from `filepath.WalkDir` on discovered repos; no user-supplied path injection.
**Output safety:** `evidence-index.jsonl` and `agent-brief.md` are written to the temp directory, not committed.
**Pass.**

### 4. Are tests/docs enough?

- **Tests:** The excerpt verifies all four families (`build-manifest`, `distribution-manifest`, `rpm-spec`, `deployment-manifest`) appear in `evidence-index.jsonl`, and the answer-contract includes the producer-evidence boundary. `go test`, `go vet`, and schema validation all pass. Adequate for PR.
- **Docs:** The answer-contract excerpt documents the `source-visible` / `not_assessed` boundary clearly. The `Reason` field in each candidate is self-documenting. Adequate.
**Pass.**

### 5. Any blocker for PR readiness?

**No.** The correction is scoped, bounded, semantically correct, tested, and documented. The minor findings above do not block.

---

## Verdict: **pass**

## Not Assessed

- Windows/macOS path handling for `relationshipCandidateFamily` (Linux-only CI observed)
- Behavior when `temp` directory write fails (out of scope for this correction)

## Recommendation

Merge as-is. Consider adding an explicit `EvidenceState` assertion in the test and a minor `make([]EvidenceRecord, 0, len(candidates)+...)` capacity hint in `buildEvidenceIndex` as follow-up polish.
