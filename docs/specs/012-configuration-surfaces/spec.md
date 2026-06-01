# Feature Specification: Configuration Surface Detection

**Feature Branch**: `012-configuration-surfaces`
**Created**: 2026-05-20
**Status**: Implemented for native file-based env, port, container, workflow,
manifest, feature-flag, and secret-reference surface inventory.
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

- **FR-001**: System MUST detect common local file-based config surfaces such
  as env vars, ports, Docker/Compose/container manifests, CI/CD workflows,
  package/dependency manifests, and feature-flag references.
- **FR-002**: System MUST redact secret values and store references only.
- **FR-003**: System MUST preserve source paths and evidence states.
- **FR-004**: System MUST represent unsupported config families, skipped large
  files, and unreadable candidate files as `not_assessed` or `cannot_verify`.
- **FR-005**: System MUST not query cloud APIs or live infrastructure in this
  slice.
- **FR-006**: System MUST NOT record secret values, connection strings, tokens,
  passwords, or private payloads in graph labels, finding summaries, evidence
  sources, fixtures, or committed outputs.
- **FR-007**: Native configuration detection MUST skip Portolan output,
  VCS/vendor/dependency/build directories, lockfiles, binary files, and
  generated artifacts that would produce noisy or private-heavy signals.

## Existing Open Source

- Semgrep and dedicated IaC/config scanners remain preferred OSS options for
  semantic config checks. Portolan already exposes Semgrep-style local output
  and safe local producer recipes through the OSS assembly path.
- Native detection is intentionally lexical and file-based so agents get a
  deterministic, dependency-free baseline without replacing mature scanners.
- Do not add cloud-provider SDKs, live infrastructure clients, or network-backed
  rules for this slice.

## Success Criteria

- **SC-001**: Fixture output contains env var, port, container, workflow,
  manifest, feature-flag, and secret-reference findings.
- **SC-002**: No fixture or output exposes secret values.
- **SC-003**: A fixture with no supported config surfaces retains a
  `configuration` `not_assessed` finding rather than claiming no configuration
  risk.
- **SC-004**: Bigtop package/runtime gaps can be mapped to config-surface
  tasks.

## Assumptions

- Runtime observation remains file-based; live infrastructure queries belong to
  later explicit profiles.
