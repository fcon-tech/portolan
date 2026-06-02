# Implementation Plan: jscpd Sharded Duplication Plan

**Branch**: `codex/079-jscpd-sharded-duplication-plan`

**Date**: 2026-06-02

**Spec**: `docs/specs/079-jscpd-sharded-duplication-plan/spec.md`

## Summary

Replace the multi-repo jscpd full-root recipe with repository-sharded native
jscpd commands in `oss-plan.json`. The feature does not execute jscpd and does
not add a Portolan duplicate detector. It gives agents safer, incremental
producer-output acquisition steps after the Bigtop full-root jscpd OOM.

## Decision Gate

- **Simpler/Faster**: Keep one bounded full-root jscpd command. Rejected for
  multi-repo landscapes because Bigtop already OOMed and agents would repeat
  the same failed producer attempt.
- **Blocking Edge Cases**: jscpd can still fail per shard, Node memory limits
  differ by environment, and sharding can miss cross-repo clones. The plan
  preserves failed/not_assessed states and does not synthesize metrics.
- **Existing Open Source**: Use native jscpd JSON reporter, output directory,
  ignore, max-size/max-lines, noSymlinks, and gitignore options. Do not
  reimplement clone detection in Portolan.

## Technical Context

**Language/Version**: Go.

**Primary Dependencies**: Standard library only.

**Storage**: Context artifacts under local output directories.

**Testing**: Focused `internal/contextprep` test, `internal/app` contract
coverage, full local baseline, and Bigtop context smoke.

**Constraints**: Local-first/read-only default; no jscpd execution, install,
network, Node memory flag changes, MCP calls, or target mutation by Portolan.

## Research

Recorded in `research.md`.

## Data Model

No new schema. `oss-plan.json` keeps the same `tools[]` and `commands[]`
shape. The jscpd plan gains multiple command entries when more than one
repository is discovered.

## Verification

```bash
go test ./internal/contextprep
go test ./internal/app
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
```

Fresh Bigtop smoke:

```bash
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<run-id>/context --profile agent --force
jq '.tools[] | select(.id == "jscpd") | {status,evidence_state,commands: [.commands[] | {label,reads,writes}]}' /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/<run-id>/context/oss-plan.json
```
