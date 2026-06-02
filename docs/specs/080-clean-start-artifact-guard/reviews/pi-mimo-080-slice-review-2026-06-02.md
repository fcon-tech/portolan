## Portolan 080 – Independent Packet Review

### Findings

| ID | Severity | Evidence | Recommendation |
|----|----------|----------|----------------|
| **F-1** | **major** | `renderAgentBrief` and `renderAnswerContract` now hard-code a "Fresh Artifact Boundary" block that emits the current context output path and explicit ignore/contamination rules. The same wording appears twice (brief + contract) plus the reordered `query-plan.md` checklist — **three prose copies of the policy that must stay in sync**. A future maintenance change that updates one but not the other silently creates conflicting guidance for downstream agents. | Factor the canonical boundary paragraph into a shared `const` or helper (e.g. `freshBoundaryNotice(out) string`) that all three renderers call. Add a test that asserts the key sentences are identical across the three generated docs. |
| **F-2** | **major** | `TestRunWritesFreshArtifactBoundaryGuidance` is the **sole** negative-path test for the clean-start guard. It checks that the three generated docs *mention* the boundary wording and *do not contain* stale path strings. However, **no test verifies that an agent or consumer that follows the guidance actually gets a clean evidence index** — i.e. that `evidence-index.jsonl`, `repos.json`, and `tool-registry.json` produced by the same `Run` call list only current-run paths and exclude stale `.portolan/stress/*` siblings. The stale files are present in the test fixture (`staleContext`, `staleRun`) but no assertion confirms they are absent from the generated JSON artifacts. | Extend the test (or add a sibling test) to unmarshal `evidence-index.jsonl` / `repos.json` from the output and assert that no path contains `old-run` or the stale context directory. This closes the loop between "doc says ignore" and "data actually excludes." |
| **F-3** | **minor** | The new `acceptance.md` § "Clean-Start Artifact Rules" uses the term **"prior stress roots unless the run ledger explicitly names them as allowed evidence"** but no `run ledger` file format or location is specified anywhere in the diff or packet. Downstream agents have no way to discover or validate such an allowance. | Either (a) add a short subsection to `acceptance.md` or the spec plan defining the ledger file (e.g. `.portolan/allowlist.json`) and its schema, or (b) remove the "unless" escape hatch until a ledger mechanism exists, to avoid ambiguous guidance. |
| **F-4** | **minor** | `renderAnswerContract` signature changed from `(root string)` to `(root, out string)`, but the function's existing call-site comment / godoc still says `renderAnswerContract returns the answer contract template`. No mention of `out` or boundary semantics. | Update the function comment to document the new `out` parameter and its role in the clean-start boundary. |
| **F-5** | **minor** | The product-backlog row for P6-080 is status **"In implementation"** but the packet carries green `go test`, `go vet`, `jq empty`, and smoke evidence that looks complete for the stated scope. This is an **evidence-state honesty** concern: either the row should be updated to reflect the new state, or an explicit note should explain why it remains "In implementation." | Update the backlog row to match the actual evidence state (e.g. "Verification in progress; awaiting peer review" or similar), or add a note. |

### Not Assessed

| Item | Reason |
|------|--------|
| GitHub review approval | Packet contains no GitHub PR or review metadata. |
| Remote branch cleanup | Not part of this local-only packet. |
| Whether `Bigtop context smoke` exercised the contamination path end-to-end | Smoke was reported as passing with fresh output, but no contaminated-lane negative run was shown. |
| Whether sibling `.portolan/stress/*` directories are actually pruned or just ignored | The guard is "ignore, don't delete" per spec, but no test asserts that stale dirs persist untouched (confirming non-destructive behaviour). |

### Verdict

**pass_with_findings**

The change correctly implements the spec's clean-start boundary disclosure in the three generated agent-facing docs and adds a focused test. However, two major findings — prose drift risk from triple-copied policy text (F-1) and the gap between "docs say ignore" and "data actually excludes stale paths" (F-2) — mean the guard is **declared but not fully verified at the data layer**. These are addressable without architectural change; once fixed the packet would be ready for merge approval (subject to the usual human sign-off).
