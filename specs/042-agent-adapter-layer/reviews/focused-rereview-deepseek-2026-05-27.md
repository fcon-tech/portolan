verdict: pass
findings:
- severity: minor
  evidence: The `validateConfidenceMap` function blocks producer labels from mapping to `source-visible` or `runtime-visible` and prevents `INFERRED`/`AMBIGUOUS` from mapping to `metadata-visible`, as shown in the updated `adapter.go`.
  recommendation: Continue rejecting evidence upgrades that lack direct Portolan source inspection and document the constraints for adapter authors.
not_assessed:
- Portolan’s future direct source inspection path for upgrading evidence states is out of scope for this contract-only validation slice.
