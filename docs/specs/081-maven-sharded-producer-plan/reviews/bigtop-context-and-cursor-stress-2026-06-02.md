# Bigtop Context Smoke And Cursor Stress

Date: 2026-06-02

Spec: `docs/specs/081-maven-sharded-producer-plan/`

## Fresh Context Smoke

Command:

```bash
go run ./cmd/portolan context prepare \
  --root /home/fall_out_bug/projects/bigtop-landscape \
  --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-maven-sharded-producer-plan/context \
  --profile cursor \
  --force
```

verified:

- Context pack was written under:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-maven-sharded-producer-plan/context`
- JSON validation passed for `repos.json`, `tool-registry.json`,
  `oss-plan.json`, and `gaps.jsonl`.
- `context/tool-outputs` is absent; no Maven, Gradle, jscpd, Syft, Docker, or
  other native producer was executed.
- `maven-cyclonedx` has `status: available_not_run` and
  `evidence_state: not_assessed`.
- `maven-cyclonedx` reports 816 visible Maven manifests across 16
  repositories.
- `maven-cyclonedx` emits 16 repository-sharded commands.
- Every Maven command writes under:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-maven-sharded-producer-plan/context/tool-outputs/maven-cyclonedx/`
- Every Maven command has `requires_user_approval: true`,
  `mutates_target: true`, and
  `network: possible_for_plugin_and_dependency_resolution`.

not_assessed:

- Actual Maven execution.
- Actual Maven/CycloneDX output validity.
- Java/Scala/Maven relationship evidence.
- Runtime topology and service communication.

## Cursor Composer 2.5 Stress

Harness:

```bash
cursor-agent --print --mode ask --model composer-2.5 --trust
```

raw artifacts:

- Prompt:
  `docs/specs/081-maven-sharded-producer-plan/stress/cursor-maven-sharded-prompt-2026-06-02.md`
- Output:
  `docs/specs/081-maven-sharded-producer-plan/stress/cursor-maven-sharded-output-2026-06-02.md`

verified:

- `artifacts_read_count: 8`
- `forbidden_read: false`
- `maven_plan_present: true`
- `maven_status: available_not_run`
- `maven_evidence_state: not_assessed`
- `maven_command_count: 16`
- `maven_repository_sharded: true`
- `maven_sample_only_gap_present: false`
- `all_maven_commands_require_approval: true`
- `all_maven_writes_under_current_context: true`
- `gradle_plan_boundary_preserved: true`
- `adapter_default_rejected: true`
- `dependency_relationships_claimable: false`
- `producer_execution_claimable: false`
- `next_action_specific_enough: true`
- `verdict: corrected`

disposition:

- Accepted as a passing stress lane for the stated correction.
- Residual notes are intentional boundaries: one retained `pom.xml` per
  Maven-bearing repository, Maven mutation/network risk remains approval-gated,
  Gradle stays commandless without safe output-path configuration, and
  dependency/JVM relationship claims remain `not_assessed`.
