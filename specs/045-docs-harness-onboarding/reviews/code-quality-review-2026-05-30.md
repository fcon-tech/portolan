# Code Quality Review: Docs And Harness Onboarding

Date: 2026-05-30

## Scope

- Branch: `codex/045-docs-harness-onboarding`
- Feature: `specs/045-docs-harness-onboarding/`
- Change type: documentation-only; no Go source, schema, fixture, or CLI behavior changes

## Decision Gate

- Simpler/Faster: A single `docs/onboarding.md` route plus small links is simpler than new harness-specific pages, `.opencode` config, installer scripts, or CLI changes.
- Blocking Edge Cases: Cursor UI behavior and arbitrary OpenCode output/target behavior are not broadly verified; docs must preserve `not_assessed` and `failed` boundaries.
- Existing Open Source: No OSS dependency is needed. Existing Markdown docs and GitHub Spec Kit artifacts are sufficient.

## Quality Findings

| Area | Assessment | Evidence | Decision |
| --- | --- | --- | --- |
| Code changes | No application code changed. | `git diff --name-status` limited to docs, SpecKit artifacts, and `.specify/feature.json` / `AGENTS.md` plan pointer. | No code-level refactor or unit-test addition needed. |
| Dependency risk | No dependencies added. | No `go.mod`, `go.sum`, package, or tool config changes. | Pass. |
| Public API / CLI contract | No public CLI command or schema changed. | `go run ./cmd/portolan --help` still runs; docs use existing command shapes. | Pass. |
| Documentation cohesion | New route links to existing maintained surfaces instead of duplicating all claims. | `docs/onboarding.md` routes to README, product claims, agent docs, acceptance, release, backlog, and AGENTS. | Pass with remaining drift risk below. |
| Localization consistency | English and Russian agent install/quickstart/prompt docs carry the OpenCode/Cursor boundary. | `docs/agent/INSTALL*.md`, `docs/agent/QUICKSTART*.md`, and `docs/agent/INSTALL-PROMPT*.md` updated. | Pass. |
| Evidence discipline | Docs preserve `verified`, `failed`, `blocked`, `unknown`, `cannot_verify`, and `not_assessed`. | `docs/onboarding.md` and prompt docs explicitly name weak states and failed OpenCode lane. | Pass. |

## Verification

- `verified`: `git diff --check`
- `verified`: `rg -n "docs/onboarding.md|OpenCode|Cursor UI|repo-local" README.md docs/agent docs/ru docs/onboarding.md docs/product-backlog.md`
- `verified`: `jq empty schema/*.json`
- `verified`: `go test -count=1 ./...`
- `verified`: `scripts/bootstrap-portolan --help`
- `verified`: `go run ./cmd/portolan --help`

## Not Assessed

- Runtime Cursor UI execution: `not_assessed`
- Fresh OpenCode execution after docs update: `not_assessed`
- GitHub checks for this branch: `not_assessed`
- Independent model review lanes: `not_assessed`

## Remaining Risk

- The route page can drift if future product claims change without updating `docs/onboarding.md`. Mitigation: it links to `docs/product-claims.md` and `docs/agent/ACCEPTANCE.md` as authoritative detailed surfaces.
