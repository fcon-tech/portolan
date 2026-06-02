# Slice Review Disposition

Spec: `docs/specs/078-build-tool-dependency-producers/`

Date: 2026-06-02

## Review Lanes

assessed:

- `zai/glm-5.1`
  - raw output:
    `docs/specs/078-build-tool-dependency-producers/reviews/pi-glm-078-slice-review-2026-06-02.md`
  - verdict: accept with one actionable metadata-honesty finding and minor
    follow-ups.
- `openrouter/xiaomi/mimo-v2.5-pro`
  - raw output:
    `docs/specs/078-build-tool-dependency-producers/reviews/pi-mimo-078-slice-review-2026-06-02.md`
  - verdict: accept with minor findings only.
- `openrouter/moonshotai/kimi-k2.6`
  - raw output:
    `docs/specs/078-build-tool-dependency-producers/reviews/pi-kimi-k2-078-slice-review-2026-06-02.md`
  - verdict: accept with minor findings only.

not_assessed:

- `kimi-coding/kimi-for-coding`
  - raw output:
    `docs/specs/078-build-tool-dependency-producers/reviews/pi-kimi-078-slice-review-2026-06-02.md`
  - reason: output included `ctx_execute_file` tool-call requests and
    references to nonexistent packet files despite no-tools instructions; kept
    as degraded raw evidence and not counted.

## Accepted Findings And Fixes

fixed:

- Maven `Reads`/`Writes` could be interpreted as the complete filesystem
  footprint. Added a `Limits` note clarifying that the list is declared context
  intent only and Maven may also read settings, parent POMs, local caches, and
  write caches, target directories, or project-defined plugin outputs.
- Gradle `status: not_assessed` with an executable present could look
  inconsistent. Added an implementation comment explaining that the executable
  exists but no safe output-path-bounded recipe is available until project-local
  plugin or init-script configuration is known.
- Wrapper precedence was not directly tested. Added a focused unit test for
  `resolveBuildToolExecutable` preferring executable `mvnw` over PATH `mvn`.
- Maven command reads were not bounded by test. Added a test assertion that
  declared reads stay under the target root for the generated Maven command.

accepted as non-blocking:

- `gradle.properties` contributes to Gradle surface count. It is an
  informational Gradle project presence signal; no command is synthesized from
  it.
- Wrapper detection is Unix-oriented and does not detect Windows `.cmd`/`.bat`
  wrappers. Current target platform for this slice is local Linux CLI.
- Shared scan limit and skip function names are relationship-candidate flavored.
  Behavior is correct and bounded; naming cleanup is follow-up material.
- Maven `outputName`/`outputDirectory` behavior remains a native CycloneDX
  plugin contract. This slice does not run Maven; output verification remains
  `not_assessed` until approved producer execution.

## Verification After Fixes

verified:

- `go test ./internal/contextprep`
- `go test ./internal/app`
- `go test ./...`
- `go vet ./...`
- `jq empty schema/*.json`
- `git diff --check`

not_assessed:

- Actual Maven/Gradle execution behavior.
- Runtime topology.
- Spec 076 Cursor parity validation.

## Disposition

accepted:

- Three assessed independent non-GPT lanes accepted the slice after bounded
  review.
- Accepted findings were fixed or classified as non-blocking follow-up.
- No critical or major blocker remains for this slice.
