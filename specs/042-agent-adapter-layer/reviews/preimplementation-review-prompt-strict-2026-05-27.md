# Strict Pre-Implementation Review Prompt - 2026-05-27

Do not inspect files. Do not call tools. Do not ask for more context. Review only the supplied facts and produce the required review.

Facts:

- Portolan is local-first, read-only, harness-independent, and a complement to OSS/code-intelligence tools.
- Allowed evidence states: `source-visible`, `metadata-visible`, `runtime-visible`, `claim-only`, `unknown`, `cannot_verify`, `not_assessed`.
- Spec 042 evaluates Graphify, SCIP/Serena-style symbol indexes, and Repomix as first-wave OSS/context adapters.
- Proposed implementation: no new dependencies; no producer execution; extend existing adapter contract with optional confidence mapping.
- Proposed Graphify mapping: `EXTRACTED` -> `metadata-visible`; `INFERRED` -> `claim-only`; `AMBIGUOUS` -> `cannot_verify`.
- Full Graphify graph import is out of scope because path normalization and graph payload parsing need a separate schema/import spec.
- SCIP/Serena and Repomix are profile/docs-only in this slice.

Return exactly:

verdict: pass | pass_with_findings | block
findings:
- severity: critical | major | minor
  evidence: one sentence
  recommendation: one sentence
not_assessed:
- one sentence
