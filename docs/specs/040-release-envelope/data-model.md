# Data Model: Release Envelope

## CI Workflow

- `name`: workflow name shown in GitHub checks
- `triggers`: pull request and push targets
- `steps`: checkout, setup Go, baseline checks, CLI smoke
- `state`: `verified`, `failed`, or `not_assessed` in closeout evidence

Validation:

- Must not require secrets.
- Must not run unbounded target scans.

## Install Smoke

- `source_checkout`: repository path
- `binary_path`: `.portolan/bin/portolan`
- `commands`: version, context prepare, map
- `result`: `verified`, `failed`, or `blocked`

Validation:

- Writes only under `.portolan/` or selected output directories.
- Network dependency download remains opt-in.

## Release Checklist

- `version`: release identifier
- `local_verification`: baseline command results
- `github_checks`: check state
- `artifacts`: produced binaries and checksums
- `claim_boundary`: reviewed `docs/product-claims.md` limitations

Validation:

- Must preserve `not_assessed` limits.
- Must not imply UI Cursor, runtime topology, or broad OSS producer validation without evidence.
