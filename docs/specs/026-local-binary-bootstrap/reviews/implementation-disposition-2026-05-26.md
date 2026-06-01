# Review Disposition: Local Binary Bootstrap

Date: 2026-05-26

## Scope

- Spec: `docs/specs/026-local-binary-bootstrap/`
- Implementation: `scripts/bootstrap-portolan`, CLI help copy, agent/Cursor
  guidance, focused bootstrap test, backlog and hypothesis ledgers.
- Product boundary: source-checkout local binary bootstrap only. No installer,
  global package manager, daemon, credential use, target repository mutation, or
  network fetching by default.

## Decision Gate

- Simpler/Faster: a small POSIX shell wrapper around `go build` is sufficient
  for the immediate agent bootstrap gap. Release packaging, Homebrew, npm,
  Docker, or auto-update flows remain out of scope.
- Blocking Edge Cases: Go may be missing, local module cache may be cold, and
  some harnesses may block direct `go run`. The script fails clearly in those
  cases instead of installing tools or fetching modules without explicit opt-in.
- Existing Open Source: Go's native build tool is the mature implementation for
  this source-checkout path. External packaging tools are not justified until
  distribution beyond a checkout is the proven bottleneck.

## Local Review Findings

- accepted/fixed: `plan.md` incorrectly described `GOSUMDB=off`; local smoke
  showed that disabling the checksum database can break toolchain verification.
  The plan now documents only `GOPROXY=off`.
- accepted/fixed: relative `--out` paths were ambiguous when the script was run
  from outside the Portolan checkout because `go build` executes from the repo
  root. The script now normalizes relative output paths against the caller's
  current directory before building.
- no open local findings after re-test.

## Model Review Lanes

- `kimi-coding/kimi-for-coding`: not_assessed. Lane produced no output and was
  terminated after hanging.
- `minimax/MiniMax-M2.7`: not_assessed. Lane returned `404 404 page not found`.
- `zai/glm-5.1`: not_assessed. Lane ignored the no-tools review contract and
  emitted a tool-call preamble instead of findings.

## Verification

- verified: `go test -count=1 ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`
- verified: `scripts/bootstrap-portolan --help`
- verified: `scripts/bootstrap-portolan --out /tmp/portolan-026/portolan`
- verified: `/tmp/portolan-026/portolan --version`
- verified: from `/tmp/portolan-026-rel`,
  `/home/fall_out_bug/projects/sdp/portolan/scripts/bootstrap-portolan --out bin/portolan`
- verified: `/tmp/portolan-026-rel/bin/portolan --version`
- verified: `go run ./cmd/portolan --help`

## Status

- Implementation: local implementation complete.
- Local verification: passed.
- Review evidence: local review passed after fixes; pi model lanes are degraded
  and recorded as `not_assessed`.
- PR state: not_assessed.
- GitHub checks: not_assessed.
- Merge readiness: not_assessed.
- Stop reason: local slice ready to commit; PR/readiness/merge surfaces are out
  of scope for this local commit.
