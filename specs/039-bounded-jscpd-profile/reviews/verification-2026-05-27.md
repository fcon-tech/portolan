# Verification

Date: 2026-05-27

## Focused Verification

- verified: `go test -count=1 ./internal/app ./internal/contextprep`
- verified: `go run ./cmd/portolan context prepare --root . --out /tmp/portolan-039-context --profile cursor --force`
- verified: `jq '.tools[] | select(.id=="jscpd") | .commands[0]' /tmp/portolan-039-context/oss-plan.json`

## Baseline Verification

- verified: `go test -count=1 ./...`
- verified: `jq empty schema/*.json`
- verified: `git diff --check`

## Producer Smoke

- verified: bounded `jscpd` run on Portolan repository smoke target produced
  `/tmp/portolan-039-jscpd/jscpd-report.json`.
- verified: rerun context preparation preserved the jscpd output and marked it
  `metadata-visible`.

## Not Assessed

- Bounded `jscpd` run on full Bigtop.
- PR checks.
- GitHub review approval.
- Merge approval.
