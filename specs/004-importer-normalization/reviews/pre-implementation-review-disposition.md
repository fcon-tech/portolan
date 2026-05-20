# Pre-Implementation Review Disposition

Date: 2026-05-20

## Scope Reviewed

- `AGENTS.md`
- `.specify/memory/constitution.md`
- `docs/product-backlog.md`
- `specs/004-importer-normalization/spec.md`
- `specs/004-importer-normalization/plan.md`
- `specs/004-importer-normalization/tasks.md`
- current CLI, graph, scan, selection, and packet implementation patterns

## Decision Gate

- Simpler/Faster: implement one local file importer for CycloneDX JSON using
  the standard library; do not invoke external tools or add parser dependencies.
- Blocking Edge Cases: malformed input, unsupported or absent refs, attribution
  on every generated fact, explicit output path safety, and no network or target
  repository mutation.
- Existing Open Source: CycloneDX and SPDX are mature SBOM standards. CycloneDX
  is the first fit because package components and dependency refs map directly
  to package nodes and `depends-on` edges.

## Findings

### accepted/fixed

- `major`: P1-004 was backlog-only and lacked `plan.md`/`tasks.md`; fixed by
  adding concrete implementation artifacts before code changes.
- `major`: Importer scope needed an OSS fit decision before implementation;
  fixed by documenting CycloneDX/SPDX/Syft/cdxgen fit in `plan.md`.
- `major`: Malformed importer input could be treated as a hard CLI failure and
  lose evidence semantics; fixed in tasks by requiring a valid graph with a
  `cannot_verify` importer node.

### rejected

- None.

### not_assessed

- External model review lanes have not run yet for this pre-implementation
  packet.
- GitHub PR state is not assessed because no PR exists for this slice yet.

## Implementation Permission

Proceed with the first implementation slice after the focused tests and fixtures
from Phase 1 are added.
