# Feature Specification: OSS Tool Output Assembly

**Feature Branch**: `022-oss-tool-output-assembly`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Product validation showed that Cursor-plus-Portolan keeps evidence
boundaries better, but the context pack is weak when `tool-registry.json` only
lists candidate files. The next layer must assemble local OSS outputs into
minimal evidence summaries without invoking external tools.

## Requirements

- **FR-001**: Context preparation MUST keep OSS composition file-based by
  default and MUST NOT run external scanners, fetch network resources, start
  daemons, or mutate target repositories.
- **FR-002**: Context preparation MUST summarize supported local jscpd-style
  duplication outputs with duplicate-group counts, confidence when present, and
  metadata-visible attribution.
- **FR-003**: Context preparation MUST summarize supported local CycloneDX/Syft
  SBOM outputs with component and dependency-record counts, confidence when
  present, and metadata-visible attribution.
- **FR-004**: Malformed or unreadable candidate outputs MUST remain in the
  registry as `cannot_verify` with a reason.
- **FR-005**: The generated Cursor brief/query plan MUST make clear that
  registered OSS outputs are evidence candidates, not final architecture
  verdicts.

## Success Criteria

- **SC-001**: A fixture with jscpd-style and CycloneDX JSON outputs produces
  registry entries with summaries and metrics.
- **SC-002**: A malformed candidate output produces a `cannot_verify` registry
  entry instead of disappearing.
- **SC-003**: Bigtop context preparation still reports no OSS outputs as an
  empty array and keeps missing families in `gaps.jsonl`.
