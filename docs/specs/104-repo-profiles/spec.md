# Feature Specification: Repo Profiles Producer (104)

**Status**: Ready for implementation

**Input**: Per-repo tier-A profile so an operator/agent can answer «что это за репо» without external docs.

## Requirements

- **FR-001**: `scripts/scan-repo-profiles.sh <target-root> <bundle-dir>` writes `repo-profiles.json`: per repo identity (id, name, path, language mix), purpose surfaces (manifest descriptions, README path+title, compose services, Dockerfile CMD/ENTRYPOINT/EXPOSE, entrypoints, API spec paths, CI workflows), module ids and declared deps, per-repo activity (last_commit, commits_30d, contributors) and maturity (readme/ci/tests/docker).
- **FR-002**: Extraction is complete for found surfaces — no arbitrary truncation; missing data is null/absent, never invented. Every profile carries `evidence_state` per field group (source-visible / metadata-visible).
- **FR-003**: `repos.json` ids become collision-safe slugs (basename + path-hash); `name` stays human basename. Viewer/bundle-query keep working via path-based attribution.
- **FR-004**: `build-portolan-bundle.sh` invokes the producer; failure records a gap, build continues.
- **FR-005**: Schema `harness/contracts/repo-profiles.schema.json`; smoke asserts profiles on a 2-repo fixture landscape.
