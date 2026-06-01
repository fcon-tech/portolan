# Feature Specification: Local Binary Bootstrap

**Feature Branch**: `026-local-binary-bootstrap`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Blind Cursor Agent acceptance showed that direct `go` / `go run`
can be blocked by the harness and that a missing installed binary makes the
first-run workflow brittle.

## Requirements

- **FR-001**: The repository MUST provide a root-discoverable, local bootstrap
  path that builds a `portolan` binary from the source checkout.
- **FR-002**: The default bootstrap output MUST be inside the Portolan checkout
  under `.portolan/bin/portolan`, not in a global system directory.
- **FR-003**: The bootstrap path MUST support an explicit `--out <file>` for
  agents that need a temporary binary path.
- **FR-004**: The bootstrap path MUST NOT install packages, mutate target
  repositories, collect credentials, start daemons, or write outside the chosen
  binary path and its parent directory.
- **FR-005**: By default, the bootstrap path MUST avoid network-backed module
  fetching. If dependencies are missing from the local Go cache, it MUST fail
  with a clear message instead of silently fetching.
- **FR-006**: Agent instructions MUST prefer an installed binary, then the
  repo-local bootstrap binary, and only then `go run` as a fallback.
- **FR-007**: Product hypothesis ledgers MUST record that this addresses
  `GAP-HARNESS-GO` / `GAP-NO-BINARY` only for source checkouts with local Go
  available.

## Success Criteria

- **SC-001**: `scripts/bootstrap-portolan --help` explains the local binary
  output and no-network default.
- **SC-002**: `scripts/bootstrap-portolan --out <tmp>/portolan` builds a binary
  that responds to `--version`.
- **SC-003**: Agent docs and Cursor rules point agents at the bootstrap path
  before using `go run`.
