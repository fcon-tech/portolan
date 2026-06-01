# Hypothesis Ledger: Vibe Coding Graph Index Cursor Acceptance

## Target

- Local target root: `/home/fall_out_bug/projects/vibe_coding`
- Acceptance client: `cursor-agent --print --mode ask --trust`
- Context pack: `/tmp/portolan-vibecoding-context-028`
- Map bundle: `/tmp/portolan-vibecoding-map-029`

## Product Gap

The previous validation proved `graph.json` was about 681 MB for a 30-repo
local landscape. `summary.json` was enough for high-level counts, but not for
bounded graph drill-down entrypoints.

## Implemented Slice

`docs/specs/029-bounded-graph-index/` adds `graph-index.json` with:

- artifact byte sizes;
- graph and finding counts;
- bounded node slices by kind;
- bounded edge slices by kind;
- bounded finding slices by kind;
- high-degree node references;
- rules telling agents to read the index before full `graph.json`.

## Verified Portolan Evidence

Command:

```bash
.portolan/bin/portolan map --root /home/fall_out_bug/projects/vibe_coding --out /tmp/portolan-vibecoding-map-029 --force
```

Observed artifact sizes:

- `graph-index.json`: 112077 bytes
- `summary.json`: 286411 bytes
- `graph.json`: 680659572 bytes
- `map.md`: 1183441 bytes

Observed bounded index:

- Node slices: configuration, duplication, package, repository, unknown
- Edge slices: depends-on, imports, observes
- Finding slices: configuration, duplication, inventory, relationships,
  technical-debt
- High-degree nodes: 25
- Top high-degree entries: `spark-k8s`, `opencode-server`, `faust-workspace`,
  `demo-adserver`, `ai-engineering-coach`

## Cursor Agent Result

Prompt asked Cursor Agent to read `answer-contract.md`, `summary.json`,
`graph-index.json`, and `gaps.jsonl`, and to avoid loading full `graph.json`
unless the bounded index was insufficient.

Result classification:

- `verified`: Cursor Agent explicitly stated `graph-index.json` was enough for
  the CTO pass.
- `verified`: Cursor Agent reported that full `graph.json` was not loaded.
- `verified`: Cursor Agent identified first graph entrypoints from
  `high_degree_nodes`, node slices, edge slices, finding slices, and coverage
  gaps.
- `verified`: Cursor Agent preserved `unknown` and `not_assessed` states for
  external completeness, runtime/service topology, OSS outputs, near-clone
  duplication, semantic config, and cross-repo service edges.

## Hypothesis Status

- H6: strengthened. `answer-contract.md` plus `summary.json` remained usable.
- H7: supported on this target. `graph-index.json` gave useful graph
  entrypoints without requiring `graph.json`.

## Remaining Gaps

- `graph-index.json` is a bounded first-read artifact, not a query engine.
- Follow-up graph slicing by repo, finding ID, or edge kind may still be needed
  when an agent wants the next local drill-down without opening full
  `graph.json`.
- UI Cursor/Composer acceptance remains `not_assessed` for this slice.
