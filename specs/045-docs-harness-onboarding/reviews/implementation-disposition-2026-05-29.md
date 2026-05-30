# Implementation Disposition: Docs And Harness Onboarding

Date: 2026-05-29

## Scope

- Feature: `specs/045-docs-harness-onboarding/`
- Branch: `codex/045-docs-harness-onboarding`
- Change type: documentation-only SpecKit slice

## Implemented

- Added `docs/onboarding.md` as a maintained route for human overview, agent run, install/build, Cursor, OpenCode, release, and SpecKit workflows.
- Linked the route from `README.md`, `docs/ru/README.md`, `docs/agent/QUICKSTART.md`, and `docs/agent/QUICKSTART.ru.md`.
- Clarified OpenCode default-permission output guidance in English and Russian install/prompt docs.
- Preserved Cursor scope wording: current evidence is headless Cursor Agent CLI / Composer, not Cursor UI behavior.
- Updated `AGENTS.md` current plan pointer and `docs/product-backlog.md` status.
- Created SpecKit artifacts, current-docs assessment, and analyze disposition under the spec-local directory.

## Verification

- `verified`: `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks`
- `verified`: `git diff --check`
- `verified`: `rg -n "docs/onboarding.md|OpenCode|Cursor UI|repo-local" README.md docs/agent docs/ru docs/onboarding.md docs/product-backlog.md`
- `verified`: `jq empty schema/*.json`
- `verified`: `go test -count=1 ./...`
- `verified`: `scripts/bootstrap-portolan --help`
- `verified`: `go run ./cmd/portolan --help`
- `verified`: quality review recorded in `specs/045-docs-harness-onboarding/reviews/code-quality-review-2026-05-30.md`
- `verified`: requirements/product-vision drift review recorded in `specs/045-docs-harness-onboarding/reviews/requirements-product-vision-drift-2026-05-30.md`
- `verified`: requested `pi` review lanes recorded in `specs/045-docs-harness-onboarding/reviews/pi-review-opus-latest-2026-05-30.md` and `specs/045-docs-harness-onboarding/reviews/pi-review-gemini-pro-latest-2026-05-30.md`
- `verified`: accepted `pi` findings dispositioned in `specs/045-docs-harness-onboarding/reviews/pi-review-disposition-2026-05-30.md`

## Not Assessed

- PR review lanes: `not_assessed`
- GitHub checks for this branch: `not_assessed`
- Cursor UI execution: `not_assessed`
- New OpenCode execution after docs changes: `not_assessed`

## Remaining Risk

- Docs-only route reduces discoverability risk but does not replace future harness acceptance runs.
- Product claim wording must continue to be checked against `docs/product-claims.md` before release, demo, or client copy updates.
