# Bigtop Context Smoke

Spec: `docs/specs/078-build-tool-dependency-producers/`

Date: 2026-06-02

## Scope

Fresh read-only context preparation against:

`/home/fall_out_bug/projects/bigtop-landscape`

Output:

`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-078-build-tool-producers/context`

## Commands

verified:

- `go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-078-build-tool-producers/context --profile agent --force`
- `jq '.tools[] | select(.id == "maven-cyclonedx" or .id == "gradle-cyclonedx") | {id,status,evidence_state,producer,executable,reason,commands}' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-078-build-tool-producers/context/oss-plan.json`
- `jq empty /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-078-build-tool-producers/context/oss-plan.json /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-078-build-tool-producers/context/tool-registry.json /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-078-build-tool-producers/context/repos.json`

## Results

verified:

- `context prepare` completed and wrote a fresh context pack.
- `oss-plan.json`, `tool-registry.json`, and `repos.json` are valid JSON.
- `maven-cyclonedx` is present with `status: available_not_run` and
  `evidence_state: not_assessed`.
- Maven surface count in the plan reason: 816 visible Maven manifests.
- Maven command writes declared dependency output only under the context
  `tool-outputs` directory and requires user approval.
- `gradle-cyclonedx` is present with `status: not_assessed` and
  `evidence_state: not_assessed`.
- Gradle surface count in the plan reason: 86 visible Gradle manifests.
- Gradle does not synthesize a command because safe output-path-bounded
  CycloneDX execution requires project-local plugin or init-script
  configuration.
- `tool-outputs` directory was absent after the run; no Maven, Gradle, Syft,
  jscpd, Docker, or other native producer output was created by this smoke.

not_assessed:

- Java/Scala/Maven dependency graph semantics remain `not_assessed` because no
  Maven/Gradle producer was executed.
- Runtime topology remains `not_assessed`.
- Spec 076 Cursor parity validation remains blocked by its own runtime-health
  evidence gate.

## Disposition

accepted:

- US3 is satisfied for this slice: the Bigtop context pack now exposes
  Maven/Gradle producer next actions without running native producers.

remaining:

- A later approved slice can decide whether to parse Maven dependency-plugin
  JSON or Gradle dependency reports directly. This slice intentionally keeps
  Portolan as a producer-output normalizer and router.
