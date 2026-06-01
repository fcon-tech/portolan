## Review Findings

### critical: none

### major: none

### minor

**M1. `relationshipCandidateFamily` RPM spec path heuristic may miss valid files outside `/specs/` or `/src/rpm/`**

The RPM spec detection requires `strings.Contains(clean, "/specs/") || strings.Contains(clean, "/src/rpm/")`. Standard RPM packaging often places `.spec` files in `SPECS/` (which the test uses and matches via `/src/rpm/`), but also directly in package roots or `rpmbuild/SPECS/`. The 20K scan limit bounds impact, but this is a coverage gap in the family detection heuristic. The stress run found only 1 rpm-spec across 18 repos, suggesting either low prevalence or under-detection.

**M2. `shouldSkipRelationshipCandidateDir` skips `build` and `dist` directories, potentially missing build manifests located there**

Some projects generate or place `pom.xml` or `build.gradle` in `build/` or `dist/` subdirectories during certain workflows. The skip list treats these as uninteresting, which is generally correct for dependency directories but may miss relocated build manifests. Given the 20K scan limit and typical project structures, this is acceptable but worth documenting.

**M3. `Count` field in `RelationshipCandidate` counts files, not distinct relationship targets**

The count represents "how many files of this family" not "how many distinct external relationships." This is semantically honest (not overclaiming), but the `Summary` says "inspect these before architecture or topology claims" without clarifying that multiple files may be redundant or hierarchical (e.g., multi-module `pom.xml` + `build.gradle`). Minor clarity gap.

---

## Review Verdict

| Question | Assessment |
|----------|-----------|
| 1. Source-visible vs parsed metadata-visible preserved? | **Yes.** `EvidenceState: "source-visible"`, `Status: "observed"`, explicit `Reason` states "semantic parsing remains not_assessed." Build evidence never promoted to topology. |
| 2. Overclaim/runtime/language-semantics issue? | **No.** Answer-contract explicitly fences `source-visible`/`metadata-visible` from runtime, and disclaims native PHP/JVM/Scala semantics. Stress test confirms Cursor Composer respected boundaries. |
| 3. Bounded scanning/path/output safety? | **Acceptable.** 20K file limit per repo, skip-list for common dependency/build dirs, `filepath.WalkDir` with error tolerance. No path traversal from user input—`repo.Path` comes from prior `discoverRepositories`. Output written to temp directory with standard perms. |
| 4. Tests/docs enough? | **Sufficient for correction scope.** Test covers all four families plus answer-contract assertions. Stress run validates real-world behavior. Would benefit from explicit test for scan limit boundary and skip-list interaction. |
| 5. PR blocker? | **No.** |

**Verdict: `pass`**

---

## not_assessed

- Performance at repo counts > 18 or file counts approaching 20K limit per repo
- Fuzzing or malicious input resistance of `relationshipCandidateFamily` regex-equivalent heuristics
- Whether `bigtop.bom` family label `"distribution-manifest"` is accurate for all Bigtop BOM use cases vs. build-manifest overlap
- Cross-platform behavior of `filepath.ToSlash` on Windows for heuristic matching

---

## Recommendation

Merge. Consider follow-up to:
1. Document the `build`/`dist` skip rationale in code comments or spec
2. Add boundary test for scan-limit truncation (currently only tested implicitly)
3. Evaluate rpm-spec heuristic expansion if real repos show false-negative patterns
