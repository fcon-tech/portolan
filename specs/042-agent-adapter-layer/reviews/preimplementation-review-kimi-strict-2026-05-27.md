verdict: pass_with_findings
findings:
- severity: major
  evidence: The `EXTRACTED` -> `metadata-visible` mapping is under-confident because extracted symbols from source-visible files should often carry `source-visible` evidence, not merely metadata.
  recommendation: Add a conditional branch that maps `EXTRACTED` to `source-visible` when the symbol's source file is present and readable, falling back to `metadata-visible` only when source access is absent.
- severity: minor
  evidence: The `AMBIGUOUS` -> `cannot_verify` mapping conflates ambiguity (a producer quality signal) with verifiability (a Portolan evidence state), which may confuse downstream consumers.
  recommendation: Document the mapping rationale explicitly in the adapter profile, or consider mapping `AMBIGUOUS` to `unknown` to preserve semantic separation.
not_assessed:
- The impact of omitting full Graphify graph import on downstream reachability queries has not been assessed.
