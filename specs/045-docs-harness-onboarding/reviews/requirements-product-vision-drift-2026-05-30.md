# Requirements And Product-Vision Drift Review: Docs And Harness Onboarding

Date: 2026-05-30

## Scope

- Feature: `specs/045-docs-harness-onboarding/`
- Compared artifacts: `docs/product-backlog.md`, `spec.md`, `plan.md`, `tasks.md`, `docs/onboarding.md`, `README.md`, `docs/ru/README.md`, `docs/agent/*`, `docs/product-claims.md`, `docs/agent/ACCEPTANCE.md`, `AGENTS.md`

## Requirements Drift

| Requirement | Implementation | Drift status |
| --- | --- | --- |
| FR-001 single onboarding route | `docs/onboarding.md` added and linked from README and agent docs. | No drift. |
| FR-002 distinguish human, claims, agent, install, acceptance, release, Cursor, OpenCode | Route table covers those intents. | No drift. |
| FR-003 preserve binary/source/no-network/go-run fallback | Existing install docs preserved; onboarding repeats preferred order without adding new install behavior. | No drift. |
| FR-004 OpenCode default-permission behavior | English/Russian install and prompt docs recommend repo-local output and name the external-output default-permission failure. | No drift. |
| FR-005 Cursor CLI/UI boundary | Onboarding, quickstart docs, and Russian README keep UI Cursor outside verified evidence. | No drift. |
| FR-006 link claims to maintained evidence | Onboarding routes to `docs/product-claims.md` and `docs/agent/ACCEPTANCE.md`. | No drift. |
| FR-007 local-first/read-only/no credentials/no daemon | Prompt and install docs keep the existing safety defaults. | No drift. |
| FR-008 discoverability from README and quickstart | README and EN/RU quickstarts link or point to the onboarding route. | No drift. |
| FR-009 backlog and SpecKit status | Backlog row and spec status say implemented locally; PR review and GitHub checks `not_assessed`. | No drift. |

## Product-Vision Drift

| Product boundary | Current implementation | Drift status |
| --- | --- | --- |
| Portolan is not tied to a harness | Onboarding treats Cursor and OpenCode as operator surfaces over local artifacts, not dependencies. | No drift. |
| Local-first and read-only defaults | No network, daemon, mutation, or credential behavior added. | No drift. |
| Preserve evidence states | New docs explicitly preserve `failed`, `unknown`, `cannot_verify`, and `not_assessed`; OpenCode failed lane remains failed. | No drift. |
| Complement existing tools | No scanner or harness replacement claim added. | No drift. |
| Source bootstrap remains default | `scripts/bootstrap-portolan` remains the install path; no Makefile or installer abstraction added. | No drift. |

## Accepted Non-Implementation

- No `.opencode` config added: accepted because the product boundary is harness-independent and current need is operator guidance, not runtime integration.
- No new Cursor UI acceptance run: accepted as `not_assessed`; current claim boundary explicitly rejects UI support claims from CLI evidence.
- No new OpenCode run: accepted as `not_assessed`; this slice changes docs only and does not broaden support claims.

## Verification

- `verified`: direct inspection of `docs/product-claims.md` and `docs/agent/ACCEPTANCE.md`
- `verified`: direct inspection of changed docs and SpecKit artifacts
- `verified`: `git diff --check`
- `not_assessed`: PR review, GitHub checks, model review lanes

## Decision

The slice may remain `Implemented locally; PR review and GitHub checks not_assessed`. It should not be described as ready-to-merge until PR state, review evidence, and checks are explicitly assessed.
