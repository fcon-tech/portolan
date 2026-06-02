# Evidence Input State Ledger

Spec: `docs/specs/076-cursor-enterprise-parity-validation/`

Date: 2026-06-02

Purpose: close the foundational evidence gate for spec 076 without running
runtime or Cursor stress. This ledger records which existing evidence may be
used by future C1-C9 scoring and which claims must remain blocked,
`not_assessed`, or `cannot_verify`.

## Inputs

| Input | Current state | Evidence classification for 076 | C1-C9 use | Boundary |
| --- | --- | --- | --- | --- |
| `docs/specs/074-bigtop-runtime-topology-health-capture/reviews/approval-state-2026-06-02.md` | Fresh explicit approval absent; runtime command not executed. | Governance/status evidence only. Runtime-health output is `not_assessed`; complete runtime topology is `cannot_verify`. | C4 blocks default parity execution. | Not runtime-visible service-health evidence. |
| `docs/specs/075-bigtop-producer-output-coverage-closure/reviews/producer-coverage-matrix-2026-06-02.md` | Merged producer matrix with bounded outputs and blocker taxonomy. | Mixed bounded evidence: `metadata-visible`, `source-visible`, partial `runtime-visible`, `not_assessed_seed_family`, and `cannot_verify` exactly as recorded per row. | Supports bounded C1-C8 scoring and blocks broad C9 parity. | Does not prove complete runtime topology, full API catalog, full dependency graph, full symbol/reference graph, or call graph. |
| `docs/specs/077-bigtop-callgraph-symbol-closure/reviews/graph-producer-decision-record-2026-06-02.md` | Merged decision record; no safe full resolved graph/callgraph producer available locally. | `cannot_verify` for full symbol/reference graph and call graph; bounded adjacent evidence remains partial. | Keeps C6 full graph/callgraph and C9 parity rejected unless later superseded. | Not a producer output; it is a reviewed decision boundary. |
| `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163222/consolidated-report.md` | Prior stress report with Cursor/OpenCode lanes and Portolan artifact metrics. | Prior-run evaluation artifact. Listed Portolan command outputs and metrics may be treated as prior-run `metadata-visible`; agent narrative remains `claim-only` unless backed by named local artifacts; contaminated lane finding is prior-run review evidence. | Useful for C1-C3/C7/C8 context and clean-start lessons; not a substitute for current 076 lanes. | Stale for 076 execution. Must not be read by baseline lane unless explicitly allowed by the run ledger. |

## Current Target Inventory

verified:

- Bigtop landscape root exists at `/home/fall_out_bug/projects/bigtop-landscape`.
- The landscape root is not itself a Git repository; it is a container for
  local inputs.
- `selection.json` exists and contains 15 selected targets.
- `repos/` contains 18 local repository directories:
  alluxio, apache-airflow, apache-bigtop-repo, apache-flink, apache-hadoop,
  apache-hbase, apache-hive, apache-kafka, apache-livy, apache-oozie,
  apache-phoenix, apache-ranger, apache-solr, apache-spark, apache-sqoop,
  apache-tez, apache-zeppelin, and apache-zookeeper.
- Top-level `/home/fall_out_bug/projects/bigtop-landscape/run` is absent.
- Existing `.portolan/stress/` contains prior roots and must be treated as
  legacy evidence unless a run ledger explicitly permits a path.

not_assessed:

- Current 076 Cursor Composer 2.5 baseline lane.
- Current 076 Cursor Composer 2.5 with-Portolan lane.
- Current 076 C1-C9 scoring ledger.
- Spec 074 runtime-health command sequence.

cannot_verify:

- Complete Bigtop runtime topology.
- Full Bigtop symbol/reference graph.
- Bigtop call graph.
- Cursor plus Portolan broad human/enterprise parity.

## Gate Decision

decision: default 076 paired Cursor stress remains blocked until spec 074
runtime-health evidence exists.

allowed without additional approval:

- Use this ledger and artifact hygiene ledger as preflight surfaces.
- Keep planning PR #55 under review.

requires additional approval:

- Running spec 074 runtime-health commands.
- Running a current-evidence rejection version of 076 while spec 074 remains
  blocked.

confidence: high
