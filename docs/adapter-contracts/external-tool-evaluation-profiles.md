# External Tool Evaluation Profiles

Last refreshed: 2026-06-05

These profiles record adoption decisions for external code-understanding tools.
They are planning and guidance artifacts, not Portolan evidence graph facts.

## Decision Summary

| Project | Role | Fit | Recommended Portolan Action |
| --- | --- | --- | --- |
| `defendend/Claude-ast-index-search` | `producer_candidate` | Strongest current symbol/reference producer candidate. | Plan future import of explicitly supplied local ast-index output in spec 085; do not install or run it by default. |
| `colbymchenry/codegraph` | `producer_candidate` | Useful but lower-fit optional candidate because default workflows can write target-local state and include install/watch/MCP behavior. | Keep as optional evaluation profile; require approval and output-boundary review before any use. |
| `Lum1104/Understand-Anything` | `ux_pattern_source` | Useful navigation and teaching patterns, but LLM-authored graph output is not verified Portolan evidence. | Borrow UX patterns only through spec 086; reject graph claims as evidence unless a future deterministic local output path is proven. |

Profile role labels are product-facing guidance only. Machine-readable producer
evidence continues to use the existing producer-family `Decision` and
`SupportState` records until a future spec changes that contract.

## Role Mapping Boundary

| Profile Role | Producer-Family Decision | Producer-Family Support State | Required Follow-Up |
| --- | --- | --- | --- |
| `producer_candidate` | `not_assessed` until local evaluation exists | `candidate_only` | Keep as guidance; open a future importer/evaluation spec before support is claimed. |
| `ux_pattern_source` | `not_assessed` for evidence production | `candidate_only` or `rejected` for evidence use | Route useful interaction ideas to a UX/navigation spec; do not emit producer evidence. |
| `ready_for_import_planning` | `narrowed` only after a local output contract is reviewed | `narrowed` | Open or update an importer spec and validate explicit local output. |
| `blocked` | `blocked` | `blocked` | Record blocker and required approval or redesign before any execution/import work. |
| `rejected` | `rejected` | `rejected` | Record why it cannot satisfy Portolan evidence boundaries; do not recommend as producer evidence. |

## Common Rules

- Profiles do not create graph facts.
- Profiles do not promote symbol/reference/call/runtime evidence to
  `source-visible`, `metadata-visible`, or `runtime-visible`.
- Candidate tools remain `not_assessed` until explicit local output exists and
  a Portolan importer or producer-evaluation record covers it.
- Network download, tool install, target mutation, hook install, MCP install,
  watcher startup, daemon startup, and global configuration writes require
  explicit human or spec-level approval.
- LLM-authored summaries, dashboards, and architecture graphs are claims until a
  future spec proves deterministic, locally supplied, evidence-bounded output.
- Refresh public metadata before depending on a profile if more than one day has
  passed since `Last refreshed`.

## Profile: ast-index

- Project identity: `defendend/Claude-ast-index-search`
- URL: https://github.com/defendend/Claude-ast-index-search
- License: MIT observed by GitHub API on 2026-06-05.
- Maintenance snapshot: default branch `main`, pushed at
  2026-06-03T14:46:59Z, 415 stars, 32 forks.
- Role: `producer_candidate`.
- Relevant output surfaces: local index/search CLI, SQLite/cache-style index,
  JSON CLI surfaces, name/string-based reference and caller-style outputs.
- Local execution posture: may create local index/cache output; optional
  watcher, hook, or MCP installation commands require approval.
- Target mutation risk: unknown until exact command and output path are
  reviewed; treat any target-local cache/write as approval-gated.
- Network/install risk: package acquisition or repository clone requires
  approval.
- Daemon/watch risk: watcher or MCP behavior is not approved by this slice.
- Privacy risk: index/cache/search output may include source paths, symbols,
  snippets, or customer-sensitive identifiers.
- Integration cost: medium; future importer spec must validate exact output
  format and map name/string references without treating them as complete call
  graphs.
- Approval boundary: do not install, run, watch, hook, or start MCP behavior
  without explicit approval and a selected output directory.
- Recommended Portolan action: strongest current candidate for future
  symbol/reference import planning in `docs/specs/085-ast-index-producer-import/`.
- Evidence limitations: no ast-index output is supplied in this slice; symbol,
  reference, caller, and call-graph evidence remain `not_assessed`.

## Profile: CodeGraph

- Project identity: `colbymchenry/codegraph`
- URL: https://github.com/colbymchenry/codegraph
- License: MIT observed by GitHub API on 2026-06-05.
- Maintenance snapshot: default branch `main`, pushed at
  2026-06-05T04:54:11Z, 41920 stars, 2584 forks.
- Role: `producer_candidate`.
- Relevant output surfaces: local code knowledge graph, agent-facing query
  surfaces, installable CLI/runtime, possible MCP/watch workflows.
- Local execution posture: useful local graph workflow, but default usage can
  write `.codegraph/` in the target and may involve install, watch, or MCP
  behavior.
- Target mutation risk: target-local `.codegraph/` writes are incompatible with
  Portolan defaults unless explicitly approved or redirected outside the target.
- Network/install risk: install scripts or package downloads require approval.
- Daemon/watch risk: watch/MCP behavior is not approved by this slice.
- Privacy risk: graph/index output may include source paths, symbols, labels,
  prompts, or summaries that should not be committed as fixtures.
- Integration cost: medium to high; future work must prove deterministic output
  shape and evidence-state mapping before import.
- Approval boundary: do not install, run, write `.codegraph/`, watch, or start
  MCP behavior without explicit approval and an output isolation plan.
- Recommended Portolan action: keep as lower-fit optional producer candidate;
  prefer ast-index for near-term symbol/reference import planning.
- Evidence limitations: no CodeGraph output is supplied in this slice; graph,
  relationship, and architecture claims remain `not_assessed`.

## Profile: Understand-Anything

- Project identity: `Lum1104/Understand-Anything`
- URL: https://github.com/Lum1104/Understand-Anything
- License: MIT observed by GitHub API on 2026-06-05.
- Maintenance snapshot: default branch `main`, pushed at
  2026-06-04T05:46:14Z, 52578 stars, 4315 forks.
- Role: `ux_pattern_source`.
- Relevant output surfaces: interactive knowledge graph, search/tour patterns,
  agent/plugin guidance, LLM-authored graph and architecture explanations.
- Local execution posture: plugin/agent workflow may install assets, write
  generated graph outputs, and depend on LLM-authored processing.
- Target mutation risk: generated graph or plugin state must be reviewed before
  any target-local writes are allowed.
- Network/install risk: marketplace or package installation requires approval.
- Daemon/watch risk: any background or plugin runtime is not approved by this
  slice.
- Privacy risk: generated knowledge graphs and summaries may contain source
  snippets, file paths, prompts, or architecture claims.
- Integration cost: high for evidence; lower for UX pattern inspiration.
- Approval boundary: do not install, run, or treat generated graph output as
  evidence without a future deterministic-output spec.
- Recommended Portolan action: borrow navigation UX ideas only in
  `docs/specs/086-evidence-navigation-ux-patterns/`.
- Evidence limitations: LLM-authored graph content is not Portolan evidence;
  all symbol/reference/architecture claims remain `not_assessed`.

## Refresh Procedure

1. Re-check project identity, license, default branch, and latest pushed date.
2. Review install, output, watcher, hook, MCP, daemon, and target-write behavior.
3. Update only the affected profile section and `Last refreshed` date.
4. If a tool moves from guidance to import planning, create or update a future
   SpecKit slice and map the decision to producer-family `Decision` and
   `SupportState` records.
5. Use `schema/producer-family.schema.json` and the producer-family precedent in
   `docs/specs/053-language-agnostic-producers/` before emitting or changing any
   machine-readable producer-family record.
6. Keep unrelated profiles unchanged unless their metadata was refreshed too.
