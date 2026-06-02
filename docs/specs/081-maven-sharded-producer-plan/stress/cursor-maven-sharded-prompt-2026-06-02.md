# Cursor Composer 2.5 Stress Prompt: Maven Sharded Producer Plan

Evaluate Portolan as a local-first navigation harness after a Maven sharded producer-plan correction.

Allowed context only:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-081-maven-sharded-producer-plan/context`

Allowed reads:

- the direct files under that context directory
- embedded paths inside those files as metadata only

Forbidden reads/actions:

- do not read sibling `.portolan/stress/*` roots
- do not read root `run/` or map bundles outside this context
- do not read `/home/fall_out_bug/projects/bigtop-landscape/repos` source files
- do not run Maven, Gradle, jscpd, Syft, Docker, or any producer
- do not install tools or mutate the target

Task:

Judge whether the previous gap is corrected: Maven next action should no
longer be a single sample `pom.xml`, but a repository-sharded approval-gated
plan. Dependency evidence and JVM relationships must remain `not_assessed`
until local producer output exists.

Return exactly these lines:

- lane_state:
- artifacts_read_count:
- forbidden_read:
- maven_plan_present:
- maven_status:
- maven_evidence_state:
- maven_command_count:
- maven_repository_sharded:
- maven_sample_only_gap_present:
- all_maven_commands_require_approval:
- all_maven_writes_under_current_context:
- gradle_plan_boundary_preserved:
- adapter_default_rejected:
- dependency_relationships_claimable:
- producer_execution_claimable:
- next_action_specific_enough:
- blocking_confusion_or_gap:
- supported_claims:
- unsupported_claims:
- verdict:
