# Implementation Plan: Bounded Graph Index

## Decision Gate

- Simpler/Faster: add a generated `graph-index.json` artifact to the existing
  map bundle. Do not add a query daemon, MCP server, database, graph storage
  replacement, or new CLI in this slice.
- Blocking Edge Cases: agents need bounded graph references, but `graph.json`
  remains the canonical machine-readable graph. The index must therefore expose
  samples and artifact budgets, not alternate graph truth.
- Existing Open Source: graph databases and code search engines are overkill
  for this slice. Go stdlib JSON plus existing in-memory graph structures are
  sufficient.

## Technical Approach

- Extend map `Artifacts` with `GraphIndex`.
- Add `graph-index.json` writer after the bundle artifacts are generated so it
  can include file sizes.
- Build deterministic bounded slices:
  - node samples grouped by kind;
  - edge samples grouped by kind;
  - finding samples grouped by kind;
  - high-degree nodes with inbound/outbound counts.
- Keep samples small and record truncation counts.
- Update map help, map docs, Cursor rule, portable skill, and answer contract.

## Verification

Run:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
scripts/bootstrap-portolan
.portolan/bin/portolan map --root /home/fall_out_bug/projects/vibe_coding --out /tmp/portolan-vibecoding-map-029 --force
jq '.budget, .artifact_sizes, .high_degree_nodes[0:5]' /tmp/portolan-vibecoding-map-029/graph-index.json
```
