# Identity Alignment Evidence

**Date**: 2026-05-30

## Changes

- `go.mod` module path changed to `github.com/fcon-tech/portolan`.
- Internal Go imports changed from `github.com/fall-out-bug/portolan/...` to
  `github.com/fcon-tech/portolan/...`.
- Release ldflags and release version test now target
  `github.com/fcon-tech/portolan/internal/app.Version`.
- README, Russian README, and agent install docs use
  `github.com/fcon-tech/portolan` for public install/clone copy.
- Added `TestCanonicalPublicIdentityStaysAligned` as a regression check.

## Verification

| Check | State | Evidence |
| --- | --- | --- |
| focused identity/version tests | verified | `go test -count=1 ./internal/app -run 'TestCanonicalPublicIdentityStaysAligned|TestReleaseBuildCanInjectVersion'` passed. |
| stale Go import scan | verified | `rg -n "github.com/fall-out-bug/portolan" --glob '*.go' .` returned no matches. |
| public identity scan | verified | `rg -n "github.com/(fcon-tech|fall-out-bug)/portolan|go install|git clone|Homebrew|brew install|Docker|docker pull|npm install|apt install|yum install" README.md docs go.mod internal -S` showed `fcon-tech` install/clone/ldflags paths and no old public install path. Docker matches were in Bigtop/configuration technical docs, not package-manager install claims. |

## Not Assessed

- GitHub release tag state is not part of identity alignment; it is recorded in
  the public install smoke review.
