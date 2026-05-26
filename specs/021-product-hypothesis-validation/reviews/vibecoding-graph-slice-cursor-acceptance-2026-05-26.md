# Hypothesis Ledger: Vibe Coding Graph Slice Cursor Acceptance

## Target

- Local target root: `/home/fall_out_bug/projects/vibe_coding`
- Acceptance client: `cursor-agent --print --mode ask --trust`
- Map bundle: `/tmp/portolan-vibecoding-map-029`
- Slice artifact: `/tmp/portolan-vibecoding-spark-slice-030.json`

## Product Gap

`graph-index.json` gives bounded first-read entrypoints, but a second
drill-down by repository, edge kind, or finding kind still required loading the
full raw `graph.json` into the agent context.

## Implemented Slice

`specs/030-graph-slice-command/` adds:

```bash
portolan graph slice --bundle <run-dir> --repo <id> --out <slice.json>
portolan graph slice --bundle <run-dir> --edge-kind <kind> --out <slice.json>
portolan graph slice --bundle <run-dir> --finding-kind <kind> --out <slice.json>
```

The command also accepts `-o` as an alias for `--out` after Cursor Agent used
that form in its suggested next command.

## Verified Portolan Evidence

Commands:

```bash
go run ./cmd/portolan graph slice --bundle /tmp/portolan-vibecoding-map-029 --repo spark-k8s --limit 25 --out /tmp/portolan-vibecoding-spark-slice-030.json --force
go run ./cmd/portolan graph slice --bundle /tmp/portolan-vibecoding-map-029 --edge-kind imports --limit 25 --out /tmp/portolan-vibecoding-imports-slice-030.json --force
go run ./cmd/portolan graph slice --bundle /tmp/portolan-vibecoding-map-029 --finding-kind technical-debt --limit 25 --out /tmp/portolan-vibecoding-debt-slice-030.json --force
```

Observed:

- `spark-k8s` repo slice: 279786 matching nodes, 279785 matching edges, 79
  matching findings; output limited to 25 nodes, 25 edges, 25 findings.
- `imports` edge-kind slice: 1844 matching nodes, 57971 matching edges; output
  limited to 25 nodes and 25 edges.
- `technical-debt` finding-kind slice: 4 matching findings; no truncation.

## Cursor Agent Result

Prompt asked Cursor Agent to read `graph-index.json` and the bounded
`spark-k8s` slice, and not load full `graph.json`.

Result classification:

- `verified`: Cursor Agent treated the slice as bounded and explicitly said it
  did not prove the full `spark-k8s` subgraph.
- `verified`: Cursor Agent preserved `cannot_verify` in sampled findings and
  did not convert scan failures into architecture conclusions.
- `verified`: Cursor Agent identified truncation counts for nodes, edges, and
  findings.
- `verified`: Cursor Agent did not load full `graph.json`.
- `accepted finding`: Cursor Agent suggested `-o`; implementation now supports
  `-o` as an alias for `--out`.

## Hypothesis Status

- H8: supported on this target. Agents can perform a second bounded drill-down
  from a real map bundle without putting full `graph.json` in the prompt.

## Remaining Gaps

- The command still reads full `graph.json` in the local process. This is
  acceptable for the current UX slice but does not solve graph storage or query
  performance.
- UI Cursor/Composer acceptance remains `not_assessed` for this slice.
