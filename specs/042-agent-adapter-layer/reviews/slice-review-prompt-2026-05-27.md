# Slice Review Prompt - 2026-05-27

Do not inspect files. Do not call tools. Review only the diff included after this prompt.

Repo rules:

- Portolan is local-first and read-only by default.
- Portolan is not a harness and must not replace OSS/code-intelligence tools.
- Evidence states must stay honest.
- Producer facts must not be upgraded to direct Portolan source/runtime evidence.
- No new dependencies are allowed unless justified.

Review planes:

- code correctness;
- schema compatibility;
- evidence semantics;
- path/output safety;
- docs/product claim scope;
- tests.

Return exactly:

verdict: pass | pass_with_findings | block
findings:
- severity: critical | major | minor
  evidence: one sentence grounded in the diff
  recommendation: one sentence
not_assessed:
- one sentence
