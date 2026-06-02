# Research

## Decision: Repository-Sharded Maven Commands

Emit one Maven/CycloneDX command per repository with visible Maven manifests.

Rationale:

- Cursor Composer 2.5 treated the single sample command from spec 078 as only
  partially adequate for Bigtop because it did not describe a multi-repo
  rollout.
- Repository sharding mirrors the direction used for large jscpd planning:
  smaller, inspectable, independently approvable actions.
- A repo-sharded plan helps agents answer "what do we need to run next" without
  claiming dependency evidence.

Rejected alternatives:

- Run Maven automatically. Rejected because Maven can download plugins,
  execute build logic, and mutate caches/targets.
- Parse `pom.xml` natively. Rejected as per-language/build-system scanner
  creep.
- Emit one command per `pom.xml`. Rejected because large multi-module Maven
  projects would explode the command list and encourage broad execution.

## Decision: Keep Gradle Commandless

Do not add a Gradle command in this slice.

Rationale:

- Spec 078 already documented that Gradle requires project-local plugin or
  init-script configuration to guarantee output under the context directory.
- The Cursor stress did not identify Gradle command absence as a defect; it
  classified it as a remaining approval/configuration gap.

## Decision: Cap Command Count

Use a bounded command cap for generated Maven commands.

Rationale:

- Enterprise landscapes can contain far more repositories than Bigtop.
- The context pack is a navigation surface, not an execution script dump.
- Capping preserves useful first actions while honestly recording that the
  list is bounded.
