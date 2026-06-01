# Pre-Implementation Review: GLM

Lane: `zai/glm-5.1`

Status: verified usable output

## Raw Output

| # | Finding | Severity | Evidence | Recommendation |
|---|---------|----------|----------|----------------|
| 1 | `symbol-index` normalization scope is bounded but needs explicit `cannot_verify` handling for partial parse failures. | minor | Packet says malformed output becomes `cannot_verify`; CycloneDX precedent has degraded missing-ref handling | Add a note/test for partial symbol-index degradation. |
| 2 | `not_assessed` vs `cannot_verify` boundary must be explicit before code. | minor | Packet distinguishes surfaces not evaluated from malformed/stale/oversized/off-scope artifacts | Clarify producer exists but fails validation => `cannot_verify`; no producer covers surface => `not_assessed`. |
| 3 | Imported producer outputs may contain file paths, internal hostnames, dependency digests, or other sensitive metadata. | minor | Security/privacy plane is in scope but not detailed | Add a brief local-only trust-boundary note. |
| 4 | `symbol-index` kind addition is additive and non-breaking. | pass | Code/schema enum extension is additive | None. |
| 5 | Format-oriented design avoids per-language adapter trap. | pass | Decision gate and spec intent rely on producer formats | None. |
| 6 | Baseline contamination risk is acknowledged but not mitigated in the first slice. | minor | Quickstart includes clean-start protocol; proposed slice does not mention hygiene validation | Include a stress-hygiene check or record the code surface as deferred. |

Verdict: `pass_with_changes`

Required before code start: clarify `cannot_verify` vs `not_assessed`, partial
parse degradation, security trust boundary, and stale-artifact hygiene scope.
