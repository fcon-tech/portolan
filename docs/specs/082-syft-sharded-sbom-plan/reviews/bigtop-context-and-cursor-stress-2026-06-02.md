# Bigtop Context Smoke And Cursor Stress

Date: 2026-06-02

Spec: `docs/specs/082-syft-sharded-sbom-plan/`

## Fresh Context Smoke

Command:

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-082-syft-sharded-sbom-plan/context \
  --profile cursor \
  --force
```

verified:

- Context pack was written under:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-082-syft-sharded-sbom-plan/context`
- JSON validation passed for `repos.json`, `tool-registry.json`,
  `oss-plan.json`, and `gaps.jsonl`.
- `context/tool-outputs` is absent; no native producer was executed.
- `cyclonedx` / Syft has `status: available_not_run` and
  `evidence_state: not_assessed`.
- Syft emits 18 repository-sharded commands.
- Every Syft command reads exactly one repository path and writes under:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-082-syft-sharded-sbom-plan/context/tool-outputs/syft/`
- Every Syft command has `requires_user_approval: true`,
  `mutates_target: false`, and
  `network: not_expected_for_local_filesystem_source`.

not_assessed:

- Actual Syft execution.
- Actual CycloneDX output validity.
- Component inventory and dependency relationships.

## Cursor Composer 2.5 Stress

Command:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust "$(cat docs/specs/082-syft-sharded-sbom-plan/stress/cursor-syft-sharded-prompt-2026-06-02.md)"
```

Rerun note:

- Reran after the Syft output-name uniqueness fix and fresh context refresh.

verified:

- `artifacts_read_count: 8`
- `forbidden_read: false`
- `syft_plan_present: true`
- `syft_status: available_not_run`
- `syft_evidence_state: not_assessed`
- `syft_command_count: 18`
- `syft_repository_sharded: true`
- `syft_full_root_command_present: false`
- `all_syft_commands_require_approval: true`
- `all_syft_writes_under_current_context: true`
- `component_inventory_claimable: false`
- `dependency_relationships_claimable: false`
- `producer_execution_claimable: false`
- `next_action_specific_enough: true`
- `verdict: pass`

not_assessed:

- jscpd sharding in this branch. Spec 082 is based on `origin/main`; jscpd
  sharding is in pending PR #57 and was not included in this isolated branch.

disposition:

- Accepted as a passing stress lane for the stated Syft correction.
- The prior single-root Syft residual gap is corrected in the current branch
  context; unrelated jscpd full-root behavior remains out of scope here because
  it belongs to pending PR #57.
