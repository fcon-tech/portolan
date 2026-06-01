# Implementation Plan: OSS Agent Context Assembly

## Decision Gate

- Simpler/Faster: add a small context-pack generator that detects local
  repositories and existing OSS output candidates. Do not execute scanners.
- Blocking Edge Cases: large folders, nested repositories, symlinks, missing
  tool outputs, stale generated artifacts, private source snippets, and false
  completeness claims.
- Existing Open Source: use existing OSS outputs as inputs. The first slice
  only detects and indexes candidate outputs; importer-normalization comes in
  later slices after license/maintenance/privacy review.

## Technical Approach

- Add `portolan context prepare --root <dir> --out <dir> --profile cursor`.
- Implement behavior in `internal/contextprep`; keep `cmd/portolan` and
  `internal/app` thin.
- Reuse local filesystem inspection only; no new dependencies.
- Bounded repository discovery:
  - root itself if it is a Git repository;
  - direct child repositories;
  - direct children under `repos/`.
- Candidate tool-output detection by filename and directory conventions:
  `jscpd`, `cyclonedx`, `syft`, `semgrep`, `catalog-info.yaml`, `openapi`,
  `asyncapi`, `structurizr`, `scip`, `lsif`, `zoekt`, `opengrok`, `sourcebot`.
- Output files:
  - `agent-brief.md`
  - `query-plan.md`
  - `repos.json`
  - `tool-registry.json`
  - `oss-plan.json`
  - `gaps.jsonl`

## Verification

Run:

```bash
go test ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan context prepare --help
```

For behavior, run a fixture command and verify the five output files exist.

## Risks

- Filename heuristics are incomplete. Mitigation: mark undetected families as
  `not_assessed` and keep adapter normalization as later work.
- Cursor may still ignore the pack. Mitigation: spec 020 updates Cursor rules
  and portable skills to require the context pack as the first surface.
- Large codebase search needs indexes, not JSON dumps. Mitigation: this slice
  records index handles but does not require index execution.
