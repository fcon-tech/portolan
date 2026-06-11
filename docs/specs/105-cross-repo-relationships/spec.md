# Feature Specification: Cross-Repo Relationships Producer (105)

**Status**: Ready for implementation

**Input**: Tier-A answer to «как связаны репозитории»: internal deps, shared external deps, cross-repo duplication.

## Requirements

- **FR-001**: `scripts/scan-cross-repo.sh <target-root> <bundle-dir>` writes `relationships.jsonl`; edge: `{id, type, from_repo, to_repo, summary, evidence_state, producer, producer_ref, detail}`.
- **FR-002**: Internal `depends-on` (metadata-visible) from repo-profiles module ids × declared deps (go.mod, package.json), plus compose `depends_on` mapping.
- **FR-003**: `shared-dependency` edges from syft SBOM intersection (component in ≥2 repos), bounded top-N by repo coverage to limit noise; threshold documented.
- **FR-004**: `--cross-repo-dup` (opt-in) in `portolan-scan.sh`: single jscpd pass over target root into `producers/jscpd-cross/`; clone pairs spanning repo boundaries become `duplication` hotspots (severity high) and `cross-repo-duplication` edges. OOM/timeout/missing → gap, scan continues.
- **FR-005**: Schema `harness/contracts/relationships.schema.json`; multi-repo-only (single repo → empty file, no fake edges); gaps recorded per undetectable surface.
