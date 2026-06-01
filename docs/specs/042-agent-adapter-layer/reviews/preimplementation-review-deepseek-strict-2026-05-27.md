verdict: pass_with_findings
findings:
- severity: minor
  evidence: Mapping Graphify's `EXTRACTED` to `metadata-visible` may understate evidence because extracted symbols come directly from source code.
  recommendation: Assess whether `EXTRACTED` should map to `source-visible` or add clear rationale for `metadata-visible`.
not_assessed:
- Full Graphify graph import path normalization and payload parsing are out of scope for this slice.
