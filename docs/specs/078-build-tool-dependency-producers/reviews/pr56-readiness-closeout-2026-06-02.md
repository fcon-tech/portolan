# PR 56 Readiness Closeout

Spec: `docs/specs/078-build-tool-dependency-producers/`

Date: 2026-06-02

PR: `https://github.com/fcon-tech/portolan/pull/56`

Head branch: `codex/078-build-tool-dependency-producers`

Base branch: `main`

Head commit at PR creation: `737ec9affbf38e139aed9a950914bb09997b0b15`

## Implementation State

verified:

- `context prepare` now detects visible Maven and Gradle build manifests.
- `oss-plan.json` includes `maven-cyclonedx` when Maven manifests are visible.
- `maven-cyclonedx` keeps `evidence_state: not_assessed`, requires user
  approval, declares possible network/dependency resolution, and marks target
  mutation risk.
- Maven declared output is under the context `tool-outputs` directory; the
  limits explicitly state that Maven may also read settings, parent POMs, local
  caches, and write caches, target directories, or project-defined plugin
  outputs.
- `oss-plan.json` includes `gradle-cyclonedx` when Gradle manifests are visible.
- `gradle-cyclonedx` keeps `status: not_assessed` and emits no command unless a
  safe output-path-bounded project-local plugin or init-script configuration is
  known.
- `answer-contract.md` and `query-plan.md` tell agents to request or evaluate
  native producer output rather than ask for Portolan-owned JVM/PHP/Scala
  adapters.
- Spec/backlog/task surfaces agree that this is a ready-for-review PR, not a
  ready-to-merge PR.

not_assessed:

- Actual Maven/Gradle producer execution.
- Maven/Gradle dependency evidence semantics beyond the generated plan.
- Runtime topology.
- Spec 076 Cursor parity validation.

## Local Verification

verified:

- `go test ./internal/contextprep`
- `go test ./internal/app`
- `go test ./...`
- `go vet ./...`
- `jq empty schema/*.json`
- `git diff --check`

## Bigtop Smoke

verified:

- Fresh context pack:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-078-build-tool-producers/context`
- `maven-cyclonedx` present with `status: available_not_run`,
  `evidence_state: not_assessed`, and 816 visible Maven manifests in the plan
  reason.
- `gradle-cyclonedx` present with `status: not_assessed`,
  `evidence_state: not_assessed`, and 86 visible Gradle manifests in the plan
  reason.
- `tool-outputs` directory was absent after the smoke; no Maven, Gradle, Syft,
  jscpd, Docker, or other native producer was executed.

## Review Evidence

assessed:

- `zai/glm-5.1`
- `openrouter/xiaomi/mimo-v2.5-pro`
- `openrouter/moonshotai/kimi-k2.6`

not_assessed:

- `kimi-coding/kimi-for-coding`; output requested tools and referenced
  nonexistent packet files despite no-tools review instructions.

disposition:

- Accepted findings fixed or recorded as non-blocking in
  `slice-review-disposition-2026-06-02.md`.
- No critical or major blocker remains for ready-for-review state.

## GitHub PR State

verified:

- PR #56 is open and not draft.
- PR head branch is `codex/078-build-tool-dependency-producers`.
- PR base branch is `main`.
- PR head commit at creation was
  `737ec9affbf38e139aed9a950914bb09997b0b15`.
- PR was mergeable at creation.

not_assessed:

- GitHub checks were pending/in progress at closeout creation and must be
  refreshed before merge.
- GitHub review approval.
- Merge approval.

## Readiness

ready-for-review PR:

- yes.

ready-to-merge PR:

- no.

merge blockers:

- current GitHub checks must be refreshed after the closeout commit;
- explicit merge approval is absent.

stop reason:

- PR is ready for review. Do not merge until current checks and explicit merge
  approval are available.
