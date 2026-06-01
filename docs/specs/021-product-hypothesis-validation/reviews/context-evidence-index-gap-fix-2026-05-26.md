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

H10 is supported on the artifact contract and on a fresh headless Cursor Agent
run against `/home/fall_out_bug/projects/vibe_coding`, with one accepted DX
finding fixed in the follow-up command guardrail update.

## Evidence

- `portolan context prepare` emits `evidence-index.jsonl`.
- Records link back to `repos.json`, `tool-registry.json`, and `gaps.jsonl`.
- Gap records preserve `unknown`, `cannot_verify`, and `not_assessed`.
- Agent brief, answer contract, query plan, Cursor rule, and portable skill now
  mention the evidence index.
- Fresh context pack: `/tmp/portolan-h10-context`.
  - `evidence-index.jsonl`: 39 records.
  - `repos.json`: 30 discovered repositories.
  - `gaps.jsonl`: 9 gap records.
- Fresh map bundle: `/tmp/portolan-h10-map`.
  - `graph.json`: 680,660,021 bytes.
  - `findings.jsonl`: 2,450 findings.
- Headless Cursor Agent accepted the intended bounded path:
  - used `evidence-index.jsonl` as the first-pass evidence boundary;
  - avoided full `graph.json`;
  - cited context and map artifacts;
  - preserved `unknown`, `cannot_verify`, and `not_assessed` surfaces.

## Accepted Finding

- Cursor Agent suggested a non-existent `portolan context --manifest` command as
  the next local command for external completeness. This was accepted as a
  command-guardrail gap. The generated `answer-contract.md`, `query-plan.md`,
  Cursor rule, and portable skill now tell agents to suggest only documented
  commands or commands from `oss-plan.json`; external completeness remains
  `unknown` until a local selection, corpus manifest, or user-supplied inventory
  exists.

## Guardrail Rerun

Prompt rerun against `/tmp/portolan-h10-context-guarded` and the same
`/tmp/portolan-h10-map` bundle:

- `verified`: Cursor Agent used `evidence-index.jsonl` as the first-pass
  evidence boundary.
- `verified`: Cursor Agent avoided full `graph.json` and used `summary.json`,
  `graph-index.json`, and bounded `findings.jsonl` sampling.
- `verified`: Cursor Agent cited `repo-*` and `gap-*` evidence records plus
  map artifacts.
- `verified`: Cursor Agent preserved `unknown`, `cannot_verify`, and
  `not_assessed`.
- `verified`: Cursor Agent did not repeat `portolan context --manifest`; for
  external completeness it stated that no listed Portolan command reduces the
  gap without user-supplied local inventory.

## Not Assessed

- UI Cursor/Composer run.
- Semantic code search or symbol-level retrieval.
