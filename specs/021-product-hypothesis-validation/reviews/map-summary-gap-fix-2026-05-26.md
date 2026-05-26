# Hypothesis Follow-Up: Map Summary Gap Fix

Date: 2026-05-26

## Source Hypothesis

H5 blind Cursor Agent acceptance classified Portolan as degraded because map
artifacts were produced but large graphs and repeated placeholder findings made
the agent workflow weaker than it should be.

## Follow-Up Implemented

`specs/024-agent-scale-map-summary/` addresses three proven H5 gaps:

- `GAP-GRAPH-SCALE`: `summary.json` is now the compact first-pass map artifact.
- `GAP-GRAPH-TYPE`: `summary.json` reports conservative file-surface counts.
- `GAP-DUP-FINDINGS`: `findings.jsonl` now has unique finding IDs.

## Evidence

- Bigtop smoke: `/tmp/portolan-024-bigtop-summary/summary.json` was 10,595
  bytes while `/tmp/portolan-024-bigtop-summary/graph.json` was 123,858,897
  bytes.
- Bigtop summary preserved weak evidence: 3 weak coverage records and 96
  `not_assessed` findings.
- Control smoke: `/tmp/portolan-024-control-summary/findings.jsonl` had 10
  findings and no duplicate IDs.

## Remaining Product Gaps

- `GAP-HARNESS-GO`: installed binary or reliable execution path still pending.
- `GAP-OSS-EMPTY`: OSS tool execution/import guidance still pending.
- `GAP-REL-NONGO`: non-Go relationship detection still pending.
- `GAP-DUP-CFG-DEBT`: native duplication, configuration, and debt detectors
  still pending.
