# Implementation Plan: Local Binary Bootstrap

## Decision Gate

- Simpler/Faster: add a small shell bootstrap script and documentation. Do not
  add GoReleaser, Homebrew, npm, Docker, or an auto-updater in this slice.
- Blocking Edge Cases: Go may be unavailable, the Go module cache may be cold,
  and some harnesses block direct `go run`. The script must fail clearly rather
  than installing tools or fetching without approval.
- Existing Open Source: Go's native `go build` is sufficient for local source
  checkout bootstrap. Release packaging tools can wait until distribution is
  the proven bottleneck.

## Technical Approach

- Add `scripts/bootstrap-portolan`.
- Build `./cmd/portolan` to `.portolan/bin/portolan` by default.
- Support `--out <file>`.
- Default to `GOPROXY=off`; allow opt-in fetch only through
  `PORTOLAN_BOOTSTRAP_ALLOW_NETWORK=1`.
- Update root/agent/Cursor docs to prefer:
  1. installed `portolan`;
  2. `.portolan/bin/portolan` from bootstrap;
  3. `go run ./cmd/portolan` fallback.

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
scripts/bootstrap-portolan --help
scripts/bootstrap-portolan --out /tmp/portolan-026/portolan
/tmp/portolan-026/portolan --version
```
