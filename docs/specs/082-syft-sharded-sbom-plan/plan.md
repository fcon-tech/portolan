# Implementation Plan: Syft Sharded SBOM Plan

**Branch**: `codex/082-syft-sharded-sbom-plan`

**Date**: 2026-06-02

**Spec**: `docs/specs/082-syft-sharded-sbom-plan/spec.md`

## Summary

Change the generic Syft/CycloneDX context plan from one full-root command to
repository-sharded commands for multi-repo landscapes. Portolan still does not
execute Syft and does not claim component/dependency evidence until local
producer output exists.

## Decision Gate

- **Simpler/Faster**: Keep one full-root Syft command. Rejected because the
  integrated Cursor stress identified it as weaker than the sharded jscpd and
  Maven next-action surfaces for Bigtop-scale landscapes.
- **Blocking Edge Cases**: Syft can be slow on a full landscape and may produce
  large SBOMs. Sharding keeps actions independently approvable and avoids
  treating missing/failed/unrun shards as coverage.
- **Existing Open Source**: Continue using Syft and CycloneDX JSON output.
  Portolan remains a planner/normalizer and does not implement an SBOM scanner.

## Verification

```bash
go test ./internal/contextprep
go test ./...
go vet ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan context prepare --root /home/fall_out_bug/projects/bigtop-landscape --out /home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260602-082-syft-sharded-sbom-plan/context --profile cursor --force
```
