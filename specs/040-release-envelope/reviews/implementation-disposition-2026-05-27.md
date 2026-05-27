# Implementation Disposition: Release Envelope

Date: 2026-05-27

Branch: `codex/040-release-envelope-delivery`

Base: `codex/productization-specs` at `872968d`

## Implementation State

Status: implemented locally

Completed tasks: T001-T022 in `specs/040-release-envelope/tasks.md`

## Files Changed

- `.github/workflows/ci.yml`
- `.gitignore`
- `README.md`
- `docs/agent/INSTALL.md`
- `docs/product-backlog.md`
- `docs/release.md`
- `internal/app/app.go`
- `internal/app/app_test.go`
- `specs/040-release-envelope/spec.md`
- `specs/040-release-envelope/tasks.md`
- `specs/040-release-envelope/reviews/*`

## Verification

### Baseline

- verified: `go test -count=1 ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`
- verified: `go run ./cmd/portolan --help`

### Install Smoke

- verified: `scripts/bootstrap-portolan`
- verified: `.portolan/bin/portolan --version`
- verified: `.portolan/bin/portolan context prepare --root . --out /tmp/portolan-context-smoke --profile cursor --force`
- verified: `.portolan/bin/portolan map --root . --out /tmp/portolan-map-smoke --force`

### Focused Tests

- verified: `TestReleaseBuildCanInjectVersion`
- verified: `TestCIWorkflowRunsReleaseEnvelopeBaseline`
- verified: `TestReleaseDocsPreserveCurrentProductClaimLimits`

## Review Evidence

- assessed: local requirements/product-vision drift review
- assessed: manual analyze disposition
- assessed: `kimi-coding/kimi-for-coding` model review, no findings
- assessed: `zai/glm-5.1` model review, no findings
- assessed: `openrouter/deepseek/deepseek-v4-pro` model review, two docs
  findings accepted and fixed
- assessed: focused `kimi-coding/kimi-for-coding` re-review accepted fixes
- failed/not counted: `openrouter/qwen/qwen3.6-max-preview` provider role
  error

## Accepted Findings Fixed

- The release checklist now explicitly requires the latest GitHub Actions run
  for the release commit or PR to pass, or to be dispositioned before release.
- The release checklist now explicitly requires product-boundary review for
  local-first/read-only operation, daemon behavior, credentials, hidden runtime
  network behavior, and target-repository mutation.

## Not Assessed

- GitHub-hosted workflow execution is not assessed until this branch is pushed
  or opened as a PR and GitHub Actions runs.
- PR state is not assessed because no PR was created in this local delivery
  slice.
- Human approval and merge readiness are not assessed.
- UI Cursor/Composer, complete inherited-estate coverage, runtime topology,
  broad OSS producer value, full Bigtop near-clone detection, and Semgrep
  remain constrained by `docs/product-claims.md`.

## Blockers

None for local implementation and verification.
