# Cursor Composer jscpd Sharded Plan Stress

Spec: `docs/specs/079-jscpd-sharded-duplication-plan/`

Date: 2026-06-02

Harness: `cursor-agent --print --mode ask --model composer-2.5 --trust`

Target: `/home/fall_out_bug/projects/bigtop-landscape`

Allowed context:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-079-jscpd-sharded-plan/context`

## Raw Artifacts

- Prompt:
  `docs/specs/079-jscpd-sharded-duplication-plan/stress/cursor-jscpd-sharded-plan-prompt-2026-06-02.md`
- Output:
  `docs/specs/079-jscpd-sharded-duplication-plan/stress/cursor-jscpd-sharded-plan-output-2026-06-02.md`

## Result

verified:

- Lane state: `verified`.
- Cursor Composer 2.5 read only the eight files under the allowed fresh context:
  `agent-brief.md`, `answer-contract.md`, `evidence-index.jsonl`,
  `gaps.jsonl`, `oss-plan.json`, `query-plan.md`, `repos.json`, and
  `tool-registry.json`.
- No sibling `.portolan/stress/*` roots, root-level `run/`, root
  `.portolan/producer-runs.jsonl`, `repos/` source files, or external jscpd
  outputs were opened.
- No native producer was run, no tool was installed, and no Bigtop target file
  was mutated.
- Cursor found the `jscpd` plan in `oss-plan.json` with
  `status=available_not_run` and `evidence_state=not_assessed`.
- Cursor identified 18 repository-sharded jscpd commands and no full-root
  jscpd command.
- Cursor verified the shard writes stay under the current context
  `tool-outputs/jscpd/<repo-id>/jscpd-report.json` directories.
- Cursor preserved failed, missing, and unrun shards as non-counting evidence
  and kept cross-repository clone detection `not_assessed`.

not_assessed:

- Actual jscpd shard execution.
- Duplication percentages, clone counts, duplicated component lists, and
  per-repository duplication rankings.
- Whether all 18 shards would complete without OOM.
- Cross-repository clone detection.
- Ingestion of jscpd findings into a map bundle.

cannot_verify:

- The prior full-root jscpd OOM event from this fresh context alone. The context
  states full-root large-landscape failures as rationale, but the historical
  OOM artifact was not an allowed input in this lane.

## Disposition

accepted:

- PR #57 gives Cursor Composer 2.5 adequate next actions for the duplication
  OOM gap without overclaiming duplication evidence.
- The exact remaining operational gap is evidence acquisition: at least one
  approved shard must run and context must be refreshed before any duplication
  claim can move beyond `not_assessed`.

no code change required:

- The stress result matches spec 079's intended scope: a local-first,
  approval-gated acquisition plan, not native jscpd execution.
