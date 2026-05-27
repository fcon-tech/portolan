# Verification Log: Release Envelope

Date: 2026-05-27

## Foundation Checks

### `scripts/bootstrap-portolan --help`

Status: verified

Output summary:

- usage exposes `scripts/bootstrap-portolan [--out <file>]`;
- default output is `.portolan/bin/portolan`;
- network fetching is disabled by default;
- retry with `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1` is documented for explicit
  network approval when the local Go module cache is missing dependencies.

## Later Checks

Final baseline and install-smoke results are recorded in
`implementation-disposition-2026-05-27.md`.
