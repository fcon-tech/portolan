# Contract: Documentation Onboarding Route

The onboarding route is a maintained documentation contract, not a CLI API.

## Required Reader Routes

| Reader intent | Required destination | Boundary that must be visible |
| --- | --- | --- |
| Understand product value | `README.md`, `docs/product-claims.md` | Portolan is a local evidence layer, not a harness or readiness gate. |
| Run an agent workflow | `docs/agent/QUICKSTART.md`, `docs/agent/INSTALL-PROMPT.md` | Agent must cite local artifacts and preserve weak states. |
| Install from source | `docs/agent/INSTALL.md`, `scripts/bootstrap-portolan` | Network dependency fetching is off by default. |
| Use Cursor | `.cursor/rules/portolan-map.mdc`, `docs/agent/ACCEPTANCE.md` | Verified evidence is headless Cursor Agent CLI / Composer, not Cursor UI. |
| Use OpenCode | `docs/agent/INSTALL-PROMPT.md`, `docs/agent/ACCEPTANCE.md` | Repo-local output works under default permissions; arbitrary external output failed in the recorded lane. |
| Prepare release notes | `docs/release.md`, `docs/product-claims.md` | Release notes must not broaden product claims. |

## Required Status Labels

Docs must use or link to these labels when discussing evidence-sensitive surfaces:

- `verified`
- `failed`
- `blocked`
- `unknown`
- `cannot_verify`
- `not_assessed`

## Non-Goals

- Do not add new CLI commands.
- Do not add new harness integrations.
- Do not add network installation behavior.
- Do not claim UI Cursor support or arbitrary OpenCode support.
