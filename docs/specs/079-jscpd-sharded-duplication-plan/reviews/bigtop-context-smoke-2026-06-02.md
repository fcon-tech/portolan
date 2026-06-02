# Bigtop Context Smoke

Spec: `docs/specs/079-jscpd-sharded-duplication-plan/`

Date: 2026-06-02

## Scope

Fresh read-only context preparation against:

`/home/fall_out_bug/projects/bigtop-landscape`

Output:

`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-079-jscpd-sharded-plan/context`

## Commands

verified:

- `go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-079-jscpd-sharded-plan/context --profile agent --force`
- `jq '.tools[] | select(.id == "jscpd") | {status,evidence_state,reason,command_count:(.commands|length),commands:[.commands[] | {label,reads,writes,limits}]}' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-079-jscpd-sharded-plan/context/oss-plan.json`
- `jq empty /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-079-jscpd-sharded-plan/context/oss-plan.json /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-079-jscpd-sharded-plan/context/tool-registry.json /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-079-jscpd-sharded-plan/context/repos.json`

## Results

verified:

- `context prepare` completed and wrote a fresh context pack.
- `oss-plan.json`, `tool-registry.json`, and `repos.json` are valid JSON.
- jscpd plan is present with `status: available_not_run` and
  `evidence_state: not_assessed`.
- jscpd plan reason states 18 repository shards are recommended to avoid
  full-root large-landscape failures.
- jscpd command count: 18.
- Each sampled command reads one repository and writes under
  `context/tool-outputs/jscpd/<repo-id>/jscpd-report.json`.
- Plan limits preserve native exit status, sequential shard execution,
  failed/missing/unrun shard honesty, and cross-repository clone
  `not_assessed`.
- `tool-outputs` directory was absent after the run; no jscpd output was
  produced by Portolan.

not_assessed:

- Actual jscpd shard execution.
- Duplication metrics.
- Cross-repository clone detection.
- Spec 076 Cursor parity validation.

## Disposition

accepted:

- US3 is satisfied for this slice: Bigtop context now exposes repository-sharded
  jscpd next actions without executing jscpd.
