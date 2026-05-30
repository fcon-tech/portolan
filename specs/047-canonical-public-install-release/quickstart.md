# Quickstart: Canonical Public Install And Release

Use this checklist after implementation.

1. Confirm canonical identity:

   ```bash
   cat go.mod
   rg -n "github.com/(fcon-tech|fall-out-bug)/portolan|go install|git clone" README.md docs go.mod internal -S
   ```

   Public launch passes only when user-facing install, clone, release, and
   ldflags paths use `github.com/fcon-tech/portolan`. Remaining
   `github.com/fall-out-bug/portolan` references must be either removed or
   explicitly documented as historical/migration-only.

2. Run baseline checks:

   ```bash
   go test ./...
   jq empty schema/*.json
   git diff --check
   ```

3. Run the primary public install smoke in a clean environment or record the
   blocker if the canonical path is not yet chosen.

4. Build a versioned release artifact:

   ```bash
   VERSION=v0.1.0
   go build -trimpath -ldflags "-X github.com/fcon-tech/portolan/internal/app.Version=$VERSION" -o /tmp/portolan ./cmd/portolan
   /tmp/portolan --version
   sha256sum /tmp/portolan
   ```

5. Inspect public copy against product claims:

   ```bash
   rg -n "Cursor|OpenCode|Bigtop|security|runtime|complete|replace|enterprise|observability" README.md docs/release.md docs/product-claims.md
   ```

6. Record release closeout with separate states for local checks, GitHub checks,
   publication, and adoption.
