# Hypothesis Ledger: Context Evidence Index Gap Fix

## Hypothesis

- ID: H10
- Claim: Cursor-plus-Portolan is more likely to answer CTO questions from local
  evidence when the context pack contains a bounded evidence index instead of
  forcing the agent to assemble scope, OSS outputs, and gaps from separate
  files first.
- Target user: CTO or agent inspecting a large local multi-repo landscape.
- Target question: "What can I safely say about scope, duplicate components,
  implicit knowledge, and service relationships before deeper drill-down?"
- Acceptance client: generated Cursor context pack plus repo-local tests.
- Failure condition: `evidence-index.jsonl` is missing, copies private source
  snippets, omits gap states, or is not referenced by agent instructions.

## Result

This slice supports H10 at the artifact-contract level. It does not replace a
fresh Cursor operator lane.

## Evidence

- `portolan context prepare` emits `evidence-index.jsonl`.
- Records link back to `repos.json`, `tool-registry.json`, and `gaps.jsonl`.
- Gap records preserve `unknown`, `cannot_verify`, and `not_assessed`.
- Agent brief, answer contract, query plan, Cursor rule, and portable skill now
  mention the evidence index.

## Not Assessed

- Fresh headless Cursor Agent run against the new artifact.
- UI Cursor/Composer run.
- Semantic code search or symbol-level retrieval.
