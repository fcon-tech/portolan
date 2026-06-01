# Public Install Smoke

**Date**: 2026-05-30

## Primary `go install` Route

Command:

```bash
rm -rf /tmp/portolan-install-smoke
mkdir -p /tmp/portolan-install-smoke/bin /tmp/portolan-install-smoke/pkg/mod
GOBIN=/tmp/portolan-install-smoke/bin \
GOMODCACHE=/tmp/portolan-install-smoke/pkg/mod \
go install github.com/fcon-tech/portolan/cmd/portolan@v0.1.0
/tmp/portolan-install-smoke/bin/portolan --version
```

State: `blocked`

Evidence:

```text
go: github.com/fcon-tech/portolan/cmd/portolan@v0.1.0: invalid version: unknown revision cmd/portolan/v0.1.0
zsh: no such file or directory: /tmp/portolan-install-smoke/bin/portolan
```

Interpretation: `v0.1.0` is not yet published in a way the Go tool can resolve
from the public repository. This is an external release-publication blocker,
not a local source-checkout failure.

Additional inspection:

- `git ls-remote --tags --heads https://github.com/fcon-tech/portolan.git`
  showed `main` at `cb7e93e` and no `v0.1.0` tag.
- The cloned public `main` still had `module github.com/fall-out-bug/portolan`
  because this implementation branch is not merged yet.

## Source Checkout Fallback

Command:

```bash
rm -rf /tmp/portolan-source-smoke
git clone https://github.com/fcon-tech/portolan.git /tmp/portolan-source-smoke
cd /tmp/portolan-source-smoke
scripts/bootstrap-portolan
.portolan/bin/portolan --version
```

State: `verified`

Evidence:

```text
wrote /tmp/portolan-source-smoke/.portolan/bin/portolan
portolan dev
```

## Closeout

User Story 1 is locally implemented with a verified source-checkout fallback.
The primary versioned `go install` route remains `blocked` until this branch is
merged and `v0.1.0` is tagged/published.
