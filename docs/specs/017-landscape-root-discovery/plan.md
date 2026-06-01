# Implementation Plan: Landscape Root Discovery

## Decision Gate

- Simpler/Faster: generate an in-memory selection from a bounded local root
  scan, then reuse the existing map selection pipeline.
- Blocking Edge Cases: root repository plus child repositories, `repos/*`
  repositories, symlinked or unreadable children, repo-like directories without
  `.git`, duplicate basenames, and output directories under `.portolan`.
- Existing Open Source: no new OSS dependency is justified for this slice.
  Deep code indexing and repository search remain future OSS composition work;
  this slice only identifies local Git checkout boundaries.

## Technical Approach

- Add bounded repository discovery to `map --root`:
  - target root itself when it is a Git repository;
  - direct child Git repositories;
  - direct children of a conventional `repos/` directory.
- Build an in-memory `selection.Selection` with one repository target per
  discovered Git checkout.
- Reuse `graphAndFindingsForSelection`, coverage, relationship detection, map
  rendering, and existing output safety.
- Append coverage records for:
  - skipped symlink candidates as `cannot_verify`;
  - repo-like non-Git child directories as `unknown`;
  - external ecosystem completeness as `unknown` unless a manifest is used by a
    later slice.
- Preserve `map --selection` behavior unchanged.

## Verification

Run:

```bash
go test -count=1 ./...
jq empty schema/*.json
git diff --check
go run ./cmd/portolan map --root <fixture-landscape> --out /tmp/portolan-root-map --force
jq empty /tmp/portolan-root-map/{run,coverage,graph}.json
```

