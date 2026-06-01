# Review: Portolan Spec 052 Correction — Relationship Candidates

## Findings

### Minor

**M-1: `docker-compose.yml` classification combined with `.pp` in single branch may cause false deployment-manifest hits on unrelated `.pp` files**
The `relationshipCandidateFamily` function classifies `docker-compose.yml/.yaml` as `deployment-manifest` (correct), but also matches `*.pp` only when the path contains `/puppet/`. This is reasonable but the two conditions are crammed into one `case`. If someone has a `docker-compose.pp` (unlikely but not impossible), it would be classified as `deployment-manifest`. The risk is negligible given the path-content heuristic, but separating these into distinct cases would improve clarity.

**M-2: No test assertion on `Count` field or `relationshipCandidateScanLimitPerRepo` enforcement**
The test sets up one file per family per repo, so `Count` is implicitly 1. There is no test verifying correct counting when multiple `pom.xml` files exist, nor any test that the 20,000-file scan limit is respected. Given that the limit prevents unbounded filesystem walks, a boundary test would strengthen confidence.

**M-3: `agent-brief.md` written with fixed `0o644` permissions; no content sanitization mentioned**
`os.WriteFile` with `0o644` is fine. The brief includes candidate summaries that embed repository IDs and paths from the filesystem. If a repo ID contained markdown-active characters (unlikely in practice), it could affect rendering. No blocker.

### (No Critical or Major findings)

---

## Answers to Review Questions

1. **Source-visible candidate vs parsed metadata-visible relationship evidence?** — Preserved correctly. `EvidenceState` is `"source-visible"`, `Reason` explicitly states "semantic parsing remains not_assessed", and `Kind` is `"relationship-candidate"` (not a relationship or dependency record). The answer-contract reinforces the boundary.

2. **Overclaim/service-topology/runtime/language-semantics issue?** — None found. The answer-contract explicitly states that source-visible records "do not prove runtime communication" and that dependency/symbol records "do not mean Portolan has native PHP, JVM, Scala, or other language semantics." The stress run confirms Cursor Composer 2.5 did not overclaim.

3. **Bounded scanning/path/output safety?** — Scanning is bounded (`relationshipCandidateScanLimitPerRepo = 20000` per repo, directory skip list covers `.git`, `node_modules`, `vendor`, etc.). Paths are local filesystem paths written to a temp directory JSONL. `filepath.WalkDir` errors are handled (continue on non-fatal, stop on limit). No shell injection or unvalidated output paths. Safe.

4. **Tests/docs enough?** — Tests cover all four families in a single repo fixture with assertions on `evidence-index.jsonl` content and the answer-contract. Adequate for the scope. Minor gap: no multi-file-per-family count test, no scan-limit boundary test (see M-2). Docs in the answer-contract and `agent-brief.md` are present and explicit.

5. **Blocker for PR readiness?** — No blocker. The implementation is conservative, well-bounded, and correctly scoped as navigation hints.

---

## Verdict: **pass_with_changes**

- Minor findings only; no critical or major issues.
- Address M-2 (add at least a scan-limit boundary test and a multi-file count test) before merge if practical; otherwise acceptable as-is.
- M-1 and M-3 are informational and non-blocking.

## Recommendation

Merge after adding a test case that exercises counting (e.g., two `pom.xml` files in different subdirectories of one repo, asserting `Count: 2`) and optionally a test with >20,000 files to confirm the scan limit fires. The semantic design is sound: relationship candidates are clearly labeled as source-visible inspection hints, not parsed topology, and the answer-contract boundary language is explicit.
