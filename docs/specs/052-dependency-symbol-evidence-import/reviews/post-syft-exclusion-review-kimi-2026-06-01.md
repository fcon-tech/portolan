## Review: Syft/CycloneDX Exclude Pattern Correction

### Findings by Severity

| Severity | Finding |
|----------|---------|
| **none** | — |

### Verdict: `not_assessed` → `approved`

### Not Assessed
- **Syft glob behavior edge cases**: `./.portolan/**` and `./run/**` rely on Syft's glob implementation. If Syft changes its working directory resolution or glob semantics in a future version, excludes may silently fail. No version pinning of `syft` is visible in this review scope.
- **Cross-platform pattern validity**: `./` prefix and `**` glob verified working in the reported Linux run. Behavior on Windows Syft builds not verified.

### Recommendation

1. **Pin or document tested Syft version** in `Limits` or plan metadata so future runs can detect version drift.
2. **Consider defensive validation**: After Syft execution, assert no `.portolan/` or `run/` paths appear in the generated SBOM to catch glob misbehavior.
3. **Add negative test case**: Verify that a mock SBOM *without* the excludes would contain excluded paths, confirming the test is actually exercising the filter.
