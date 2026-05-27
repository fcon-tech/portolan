# Feature Specification: Release Envelope

**Feature Branch**: `040-release-envelope`

**Created**: 2026-05-27

**Status**: Ready-for-review PR #20; local baseline/install smoke and GitHub CI verified; merge approval not_assessed

**Input**: Product-readiness gap: Portolan has a working local product kernel, but external users still lack a versioned release, CI proof, and clean-checkout install smoke.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Verify Every Pull Request (Priority: P1)

A maintainer can rely on GitHub checks to run the Portolan baseline before a PR is described as ready-for-review.

**Why this priority**: Recent PR closeouts repeatedly recorded GitHub checks as `not_assessed`; a product cannot depend only on local verification ledgers.

**Independent Test**: Inspect the workflow definition and run the same local commands it invokes: `go test -count=1 ./...`, `jq empty schema/*.json`, `git diff --check`, and a CLI smoke command.

**Acceptance Scenarios**:

1. **Given** a pull request or push to `main`, **When** CI runs, **Then** it executes the baseline checks and a CLI help/version smoke without requiring secrets.
2. **Given** the workflow cannot run in the local environment, **When** a closeout is written, **Then** GitHub checks remain `not_assessed` rather than described as green.

---

### User Story 2 - Install From A Clean Checkout (Priority: P1)

An agent or user can bootstrap a repo-local Portolan binary from a clean source checkout and verify the binary without knowing internal Go commands.

**Why this priority**: Portolan is agent-facing. The first external experience should be a boring install path, not a development-only `go run` fallback.

**Independent Test**: Run `scripts/bootstrap-portolan` in a clean checkout, then run `.portolan/bin/portolan --version`, `context prepare`, and `map` against a small target.

**Acceptance Scenarios**:

1. **Given** Go is available and modules are cached, **When** `scripts/bootstrap-portolan` runs, **Then** it writes `.portolan/bin/portolan` without network access.
2. **Given** the Go module cache is missing, **When** bootstrap runs without explicit approval for network, **Then** it fails with a clear safe retry instruction.

---

### User Story 3 - Package A Release Candidate (Priority: P2)

A maintainer can tag or prepare a release candidate with clear version, checksum, and release-note guidance.

**Why this priority**: Without a release envelope, external users cannot tell which product surface was validated.

**Independent Test**: Follow the release checklist from docs and verify it names versioning, local checks, artifact checksums, and known `not_assessed` limitations.

**Acceptance Scenarios**:

1. **Given** a release candidate is prepared, **When** a maintainer reads the release checklist, **Then** it identifies required local and GitHub evidence before publishing.
2. **Given** a limitation is still `not_assessed`, **When** release notes are drafted, **Then** the limitation is copied from `docs/product-claims.md` rather than omitted.

### Edge Cases

- GitHub Actions is unavailable or no checks are configured.
- The clean checkout lacks cached Go modules.
- A developer runs bootstrap from a subdirectory.
- Generated release artifacts would write outside the selected release output directory.
- Release notes overstate UI Cursor, runtime topology, Semgrep, or complete estate coverage.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST define a GitHub Actions workflow that runs the baseline checks without secrets.
- **FR-002**: The workflow MUST include a CLI smoke that proves the checked-out command surface starts successfully.
- **FR-003**: The install documentation MUST distinguish installed binary, source checkout bootstrap, and `go run` fallback.
- **FR-004**: The release checklist MUST require version, local baseline, GitHub checks, artifact checksum, and product-claim boundary review.
- **FR-005**: The release checklist MUST preserve `not_assessed` limitations from `docs/product-claims.md`.
- **FR-006**: The bootstrap path MUST keep no-network as the default unless the user explicitly opts in.
- **FR-007**: The implementation MUST not add a daemon, credentials, hidden network calls, or target-repo mutation.

### Key Entities

- **CI Workflow**: GitHub Actions definition for local baseline and CLI smoke.
- **Release Checklist**: Maintainer-facing document that binds release publication to evidence.
- **Install Smoke**: Clean-checkout command sequence proving an external user can get a working binary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A clean local run of the workflow command set passes.
- **SC-002**: A clean bootstrap smoke produces a runnable `.portolan/bin/portolan` binary.
- **SC-003**: Release documentation includes every current `not_assessed` product limitation from `docs/product-claims.md`.
- **SC-004**: PR closeouts can cite GitHub checks as `verified` or `failed` when the workflow runs, and keep them `not_assessed` only when GitHub itself is not evaluated.

## Assumptions

- GitHub Actions is the first CI surface because the repository already uses GitHub PR closeouts.
- The initial release envelope can build from source; package-manager distribution is out of scope.
- Network-backed dependency download remains opt-in for source bootstrap.
