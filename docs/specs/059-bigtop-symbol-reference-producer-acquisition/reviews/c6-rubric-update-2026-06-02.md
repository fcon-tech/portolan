# C6 Rubric Update: Symbol/Reference Evidence

Date: 2026-06-02

## Previous C6 State

From Spec 058:

- C6 full symbol/reference graph: `not_assessed`.
- Partial selected-file `gopls symbols` output existed for 5 Airflow Go SDK
  files.
- No full definition/reference producer was available.

## New Evidence

Spec 059 acquired and ran Universal Ctags across the 15 selected Bigtop targets.

Evidence:

- Producer run: `producer-run-bigtop-selected-universal-ctags-20260602`
- Output: `tool-outputs/bigtop-selected-universal-ctags.jsonl`
- Total tags: 5,390,732
- Unique files: 93,380
- Bad JSON lines: 0
- Dominant role: `def`

## Updated C6 State

| Criterion | Previous state | Updated state | Reason |
| --- | --- | --- | --- |
| C6 Symbol/reference graph | `not_assessed` for full graph; partial selected-file symbols | partial | Broad selected-scope symbol definitions are verified, but reference edges are still absent. |

## Claim Boundary

Allowed:

- "Portolan has broad selected-scope symbol definition evidence for Bigtop from
  Universal Ctags."
- "C6 improves from selected-file symbol listing to broad symbol definitions."

Forbidden:

- "Portolan has a full symbol/reference graph for Bigtop."
- "Portolan proves cross-repo references or call graph."
- "Enterprise code-intelligence parity is verified."

Runtime topology remains `not_assessed`.
