# Feature Specification: Configuration Surface Detection

**Feature Branch**: `012-configuration-surfaces`
**Created**: 2026-05-20
**Status**: Backlog spec
**Input**: Product backlog P2-012: map env vars, ports, manifests, CI/CD,
feature flags, and secret references without exposing secret values.

## User Scenarios & Testing

### User Story 1 - Map Local Configuration Surfaces (Priority: P1)

An agent can see which configuration surfaces exist in a repository without
manual file-by-file exploration.

**Independent Test**: A fixture with Docker, CI, env var, and config files emits
configuration findings with source-visible evidence.

### User Story 2 - Protect Secrets (Priority: P1)

A reviewer can see that a secret reference exists without Portolan recording the
secret value.

**Independent Test**: A fixture with secret-like values emits redacted source
pointers and no secret payload.

### User Story 3 - Identify Drift And Unknowns (Priority: P2)

Portolan shows config drift and missing ownership or environment context as
findings instead of hiding them.

**Independent Test**: Staging/prod config drift emits a finding; missing
environment mapping emits `unknown`.

## Requirements

- **FR-001**: System MUST detect common local config surfaces such as env vars,
  ports, Docker, Compose, Kubernetes, Helm, CI/CD, and feature flags.
- **FR-002**: System MUST redact secret values and store references only.
- **FR-003**: System MUST preserve source paths and evidence states.
- **FR-004**: System MUST represent unsupported config families as
  `not_assessed`.
- **FR-005**: System MUST not query cloud APIs or live infrastructure in this
  slice.

## Existing Open Source

- Prefer mature local parsers for YAML/JSON/TOML where useful.
- Consider Semgrep-style local rules for pattern detection after fixture needs
  prove simple parsing insufficient.
- Do not add cloud-provider SDKs for this slice.

## Success Criteria

- **SC-001**: Fixture output contains env var, port, container, and CI findings.
- **SC-002**: No fixture or output exposes secret values.
- **SC-003**: Bigtop package/runtime gaps can be mapped to config-surface tasks.

## Assumptions

- Runtime observation remains file-based; live infrastructure queries belong to
  later explicit profiles.
