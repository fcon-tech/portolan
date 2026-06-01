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
   blocker if the canonical path is not yet published. The first release is
   source-first: `go install` builds the command locally from module source and
   is distinct from downloadable prebuilt binaries.

   ```bash
   export GOBIN=/tmp/portolan-install-smoke/bin
   export GOMODCACHE=/tmp/portolan-install-smoke/pkg/mod
   rm -rf /tmp/portolan-install-smoke
   mkdir -p "$GOBIN" "$GOMODCACHE"
   go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
   "$GOBIN/portolan" --version
   ```

   Before `v0.1.0` is tagged, record this as `blocked` for external
   publication and run the source-checkout equivalent instead:

   ```bash
   git clone https://github.com/fcon-tech/portolan.git /tmp/portolan-source-smoke
   cd /tmp/portolan-source-smoke
   scripts/bootstrap-portolan
   .portolan/bin/portolan --version
   ```

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
   rg -n "Homebrew|brew install|Docker|docker pull|npm install|apt install|yum install" README.md docs
   ```

6. Record release closeout with separate states for local checks, GitHub checks,
   publication, and adoption.
