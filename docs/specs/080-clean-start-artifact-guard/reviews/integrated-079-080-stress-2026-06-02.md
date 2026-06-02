# Integrated 079 + 080 Stress

Date: 2026-06-02

Scratch branch:
`codex/081-integrated-navigation-stress`

Base: `origin/main`

Integrated heads:

- PR #57 / `origin/codex/079-jscpd-sharded-duplication-plan`
- PR #58 / `origin/codex/080-clean-start-artifact-guard`

This is local integration evidence only. It is not a merge approval and does
not change the ready-to-merge state of PR #57 or PR #58.

## Merge Reconstruction

verified:

- PR #57 and PR #58 were each open, not draft, mergeable, and had passing
  GitHub checks on their current heads before this integration evidence was
  recorded.
- A scratch branch can combine both code paths.
- `internal/contextprep/contextprep.go` merged without conflict.
- Combined `contextprep` behavior passes local tests.

integration conflicts observed:

- `.specify/feature.json`
- `AGENTS.md`
- `docs/product-backlog.md`
- `internal/contextprep/contextprep_test.go`

disposition:

- The conflicts are expected status/pointer/test co-location conflicts, not a
  runtime behavior blocker.
- The scratch resolution keeps both P6-079 and P6-080 backlog rows, points the
  current SpecKit helper to the later P6-080 plan, and keeps both regression
  test groups.

## Local Verification

verified:

- `go test ./internal/contextprep`
- `go test ./...`
- `go vet ./...`
- `jq empty schema/*.json`
- `git diff --check`

## Fresh Context

Command:

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context \
  --profile cursor \
  --force
```

verified:

- Fresh context pack was written under:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-integrated-navigation-stress/context`
- `context/tool-outputs` is absent; no native producer was run.
- JSON artifacts validate with `jq empty`.
- jscpd plan is `available_not_run` / `not_assessed`.
- jscpd command count is 18.
- Exact stale producer output strings from `20260601-054-initial-proof` are
  absent from the generated context.
- `agent-brief.md` reports 5 local producer-run records, 0 verified current
  records, and 5 `not_assessed`.
- `answer-contract.md` and `query-plan.md` include sharded jscpd and
  non-aggregation guidance.

## Cursor Composer 2.5

raw artifacts:

- Prompt:
  `docs/specs/080-clean-start-artifact-guard/stress/cursor-integrated-079-080-prompt-2026-06-02.md`
- Degraded output:
  `docs/specs/080-clean-start-artifact-guard/stress/cursor-integrated-079-080-output-2026-06-02.md`
- Concise prompt:
  `docs/specs/080-clean-start-artifact-guard/stress/cursor-integrated-079-080-concise-prompt-2026-06-02.md`
- Final concise output:
  `docs/specs/080-clean-start-artifact-guard/stress/cursor-integrated-079-080-concise-output-2026-06-02.md`

degraded:

- The first Cursor lane started with `verified` and `forbidden_read=no`, but
  the raw output stopped mid-sentence before completing the requested answer
  contract. It is retained as degraded evidence, not counted as the final lane.

verified final lane:

- `artifacts_read_count: 8`
- `forbidden_read: false`
- `fresh_boundary_present: true`
- `stale_producer_runs_not_assessed: true`
- `stale_path_output_command_scrubbed: true`
- `jscpd_status: available_not_run`
- `jscpd_evidence_state: not_assessed`
- `jscpd_command_count: 18`
- `jscpd_repository_sharded: true`
- `jscpd_full_root_command_present: false`
- `jscpd_writes_under_current_context: true`
- `missing_failed_unrun_shards_non_counting: true`
- `duplication_metrics_claimable: false`
- `verdict: pass`

not_assessed:

- Actual jscpd shard execution.
- Duplication metrics and clone counts.
- Runtime topology and service communication.
- Arbitrary agent obedience outside this bounded Cursor prompt.
- Ready-to-merge state for PR #57 or PR #58.

## Disposition

accepted:

- The combined #57 + #58 context reaches the current adequate navigation
  harness level for the duplication/OOM plus clean-start artifact gap: it gives
  concrete approval-gated next actions and keeps unsupported claims
  `not_assessed`.

no code correction required:

- The integrated stress found merge-status conflicts but no context generation,
  evidence-state, or Cursor navigation behavior defect.

remaining gate:

- Mainline progress still requires explicit merge approval for PR #57/#58, or
  separate explicit approval for native jscpd shard execution if duplication
  evidence should move beyond `not_assessed`.
