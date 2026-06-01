# Quickstart: Release Envelope

## Local Verification

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan --help
```

## Clean-Checkout Smoke

```bash
scripts/bootstrap-portolan
.portolan/bin/portolan --version
.portolan/bin/portolan context prepare --root . --out /tmp/portolan-context-smoke --profile cursor --force
.portolan/bin/portolan map --root . --out /tmp/portolan-map-smoke --force
```

## Release Review

Before release publication:

1. Read `docs/product-claims.md`.
2. Copy `not_assessed` limits into release notes.
3. Record GitHub checks as `verified`, `failed`, or `not_assessed`.
4. Attach checksums for any published binaries.
