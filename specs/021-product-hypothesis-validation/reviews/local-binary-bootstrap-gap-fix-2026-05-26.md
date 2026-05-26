# Hypothesis Follow-Up: Local Binary Bootstrap Gap Fix

Date: 2026-05-26

## Source Hypothesis

H5 blind Cursor Agent acceptance showed two execution gaps:

- `GAP-HARNESS-GO`: Cursor may block direct `go` / `go run`.
- `GAP-NO-BINARY`: no installed `portolan` binary was available.

## Follow-Up Implemented

`specs/026-local-binary-bootstrap/` adds `scripts/bootstrap-portolan`.

The bootstrap path:

- builds `./cmd/portolan` from a source checkout;
- writes to `.portolan/bin/portolan` by default;
- supports `--out <file>` for temporary agent paths;
- defaults to `GOPROXY=off` and `GOSUMDB=off`;
- does not install packages or write into target repositories.

## Evidence Boundary

This closes the source-checkout bootstrap path only when local Go is available
and the module cache already contains required dependencies. It does not provide
published release artifacts, Homebrew/npm/package manager installation, or a
Cursor extension.

## Remaining Product Gaps

- Published binary distribution is still not assessed.
- `GAP-REL-NONGO`: non-Go relationship detection still pending.
- `GAP-DUP-CFG-DEBT`: native duplication, configuration, and debt detectors
  still pending.
