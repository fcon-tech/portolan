# Implementation Plan: Agent-Scale Map Summary

## Decision Gate

- Simpler/Faster: add one compact summary artifact derived from existing
  map artifacts and dedupe findings by ID. Do not build a DB, index server,
  LSP, or MCP surface in this slice.
- Blocking Edge Cases: large graphs cannot be loaded into prompts; summary
  must stay honest about weak evidence; dedupe must not merge distinct
  repo-prefixed findings.
- Existing Open Source: no dependency is justified for counting and
  classification over Portolan's existing JSON structures. Larger indexing can
  be evaluated later if proven necessary.

## Technical Approach

- Extend the map artifact contract with `summary.json`.
- Generate summary from existing in-memory run metadata, graph, findings, and
  coverage ledger before writing `map.md`.
- Classify file inventory surfaces conservatively by filename and extension.
- Dedupe findings by exact `id` only, preserving repo-prefixed findings as
  distinct evidence.
- Update agent docs so `summary.json` is the first map artifact an agent reads.

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan map --root /home/fall_out_bug/projects/bigtop-landscape --out /tmp/portolan-024-bigtop-summary --force
jq empty /tmp/portolan-024-bigtop-summary/summary.json
go run ./cmd/portolan map --root /home/fall_out_bug/projects/consensus_tg_bot --out /tmp/portolan-024-control-summary --force
```
