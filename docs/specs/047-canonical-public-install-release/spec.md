# Feature Specification: Canonical Public Install And Release

**Feature Branch**: `codex/047-public-showcase-specs`

**Created**: 2026-05-30

**Status**: Implemented and merged via PR #22; canonical identity
`github.com/fcon-tech/portolan` migrated on `main`, post-merge source-checkout
fallback verified, local `v0.1.0` build/checksum smoke verified, versioned
public `go install` blocked until `v0.1.0` tag publication

**Input**: User description: "Specs for a public showcase/popularization path."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install From The Public Repository (Priority: P1)

A first-time external evaluator can copy one public install or clone command
from GitHub documentation and get a working `portolan --version` result without
knowing repository history.

**Why this priority**: A public showcase fails at the first step if the GitHub
organization, Go module path, release command, and README examples disagree.

**Independent Test**: In a clean environment, run the documented public install
or clone path and verify `portolan --version` succeeds.

**Acceptance Scenarios**:

1. **Given** a user starts at the public GitHub repository, **When** they copy
   the primary install command, **Then** the command resolves the same canonical
   repository/module identity documented in the README.
2. **Given** a user cannot or should not fetch modules from the network, **When**
   they follow the source-checkout path, **Then** the no-network bootstrap
   boundary remains explicit and failures are documented as blocked, not hidden.

---

### User Story 2 - Publish A Bounded First Release (Priority: P2)

A maintainer can prepare a first public release candidate with versioned
artifacts, checksums, release notes, and claim boundaries that do not overstate
Portolan's validation evidence.

**Why this priority**: The repository already has a release envelope, but a
public launch needs one canonical release story that works for outsiders.

**Independent Test**: Follow the release checklist from a clean checkout, build
the release artifact, verify the checksum, and inspect release notes for
product-claim boundaries.

**Acceptance Scenarios**:

1. **Given** a maintainer prepares `v0.1.0`, **When** they build the binary,
   **Then** `portolan --version` reports that version.
2. **Given** release notes mention Bigtop, Cursor, OpenCode, OSS adapters, or
   security, **When** a reviewer compares them with `docs/product-claims.md`,
   **Then** every positive claim is accepted or narrowed and every missing area
   remains visible as `not_assessed`, `failed`, or `rejected`.

---

### User Story 3 - Keep Release Readiness Separate From Popularity (Priority: P3)

A maintainer can say the release/install surface is ready for public testing
without implying GitHub popularity, ecosystem adoption, or merge approval.

**Why this priority**: Portolan's strength is evidence discipline. The public
release surface should preserve that discipline instead of turning checks into
marketing claims.

**Independent Test**: Inspect the release closeout and confirm it separates
local verification, GitHub checks, release publication, GitHub settings, and
community adoption.

**Acceptance Scenarios**:

1. **Given** local release checks pass, **When** GitHub checks or release
   publication are not checked, **Then** they are recorded as `not_assessed`.
2. **Given** the release is published, **When** nobody has starred, forked, or
   adopted it yet, **Then** docs do not imply adoption.

### Edge Cases

- The public GitHub repository path differs from the Go module path.
- Existing docs or release ldflags still point to an old module path.
- `go install` succeeds for one path and fails for another.
- A user expects prebuilt binaries even though the first release is
  source-first.
- GitHub release checks are absent or not inspected.
- The release contains Bigtop or agent-harness wording that exceeds
  `docs/product-claims.md`.
- Users ask for Homebrew, npm, Docker, or package-manager install paths before
  they are implemented.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The public release spec MUST choose or block on exactly one
  canonical public identity: repository URL, Go module path, clone command, Go
  install command, release ldflags path, and README examples.
- **FR-002**: If the canonical identity changes, implementation MUST update
  docs, release commands, tests, and import/module references that would make a
  public install fail.
- **FR-003**: The README MUST expose one primary public install path and one
  source-checkout fallback without requiring readers to inspect SpecKit reviews.
- **FR-004**: The release checklist MUST include version selection, clean
  checkout build, `portolan --version`, baseline checks, checksum generation,
  GitHub check state, and product-claim review.
- **FR-005**: Release notes MUST use only `accepted` or `narrowed` positive
  claims from `docs/product-claims.md`.
- **FR-006**: Release notes MUST keep unsupported areas visible as
  `not_assessed`, `failed`, `blocked`, or `rejected`.
- **FR-007**: Public install docs MUST not add network access, daemon behavior,
  mutation, telemetry, credentials, or external service dependencies beyond
  normal package fetching explicitly initiated by the user.
- **FR-008**: Package-manager claims such as Homebrew, Docker, npm, or apt MUST
  remain absent until implemented and verified.
- **FR-009**: A release closeout MUST distinguish local release readiness,
  GitHub release publication, GitHub checks, and adoption/popularity.
- **FR-010**: First-release public copy MUST be compact and safe: it MUST state
  what Portolan is, the fastest install route, what is verified, what remains
  out of scope, and how to run the Apache Bigtop demo without implying adoption
  or broad benchmark proof.
- **FR-011**: The `v0.1.0` artifact policy MUST be source-first: Git tag,
  GitHub release notes, source archive, `go install` path, source-checkout
  bootstrap path, and checksums only for any artifact explicitly built during
  release closeout. Prebuilt binaries are out of scope unless a maintainer
  explicitly expands the release slice.

### Key Entities

- **Canonical Identity**: The single public repository/module/install identity
  used by docs, Go module metadata, release commands, and tests.
- **Install Path**: A documented route such as `go install`, source checkout
  bootstrap, or downloaded release artifact.
- **Release Candidate**: A version, artifact set, checksum list, release notes,
  and verification record.
- **Claim Boundary**: The maintained product wording allowed by
  `docs/product-claims.md`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The primary public install command succeeds in a clean checkout or
  clean Go module cache environment, or the spec records a blocker before
  publication.
- **SC-002**: README, release checklist, and release notes use the same
  canonical repository/module identity.
- **SC-003**: A reviewer can find the release/install route from the README in
  under two minutes.
- **SC-004**: Release notes include at least one explicit limitation paragraph
  derived from `docs/product-claims.md`.
- **SC-005**: Local baseline checks, GitHub checks, release publication, and
  adoption are reported separately as `verified`, `failed`, `blocked`, or
  `not_assessed`.

## Assumptions

- The first public release version is `v0.1.0`.
- The canonical public identity is `github.com/fcon-tech/portolan`; the old
  `github.com/fall-out-bug/portolan` path is migration history, not public
  launch identity.
- The first public release is source-first. Prebuilt binaries are deferred until
  release signing/checksum and platform smoke expectations are explicitly
  defined.
- The release style should be technical, restrained, and evidence-forward:
  useful first, polished second, no hype badges or adoption claims.
- This slice is about install/release credibility, not community profile,
  showcase demo, or PR review automation.
