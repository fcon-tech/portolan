# Feature Specification: Bigtop Producer Output Coverage Closure

**Feature Branch**: `codex/075-bigtop-producer-output-coverage-closure`

**Created**: 2026-06-02

**Status**: Merged via PR #53

**Input**: Specs 054-073 produced real Bigtop evidence beyond Syft/CycloneDX:
Compose and Helm deployment models, protobuf descriptors, Semgrep local-rule
catalog mentions, Universal Ctags definitions/import references, bounded jscpd,
partial gopls symbols, existing-artifact `jdeps`, and partial runtime-visible
Docker/NodeManager evidence. This slice will inventory, refresh where safe, and
coverage-score those producer outputs before architecture parity is revisited.

## Requirements

- **FR-001**: Inventory all real producer outputs beyond Syft/CycloneDX from
  specs 054-074.
- **FR-002**: Classify each producer family as `verified`, `partial`,
  `failed`, `blocked`, `cannot_verify`, or `not_assessed`.
- **FR-003**: Coverage-score symbol, API, catalog, model, dependency,
  duplication, Semgrep, and runtime producer outputs against the C1-C9
  architecture rubric.
- **FR-004**: Refresh only safe local producer outputs that do not mutate target
  repositories, require credentials, or start services unless explicitly
  approved by their own spec.
- **FR-005**: Preserve gaps for full symbol/reference graph, call graph, and
  runtime topology unless spec 074 or a later runtime slice supplies verified
  evidence.
- **FR-006**: Run Cursor stress and independent review before any claim upgrade.

## Success Criteria

- **SC-001**: A producer-output coverage matrix cites concrete artifacts,
  commands, hashes, scopes, and limitations.
- **SC-002**: The matrix separates real producer-run evidence from static docs,
  claims, and absent tools.
- **SC-003**: Cursor plus Portolan can use the matrix without upgrading partial
  producer outputs into full architecture proof.

## Dependencies

- Spec 074 runtime result.
- Existing producer ledgers from specs 054-073.

## Seed Producer Families

Spec 075 must start from at least these families:

- Runtime health summary from spec 074:
  `schema_version=portolan.runtime-health.v1`,
  `producer_id=bigtop-docker-provisioner-health-074`.
- Docker Compose deployment model from spec 067.
- Helm deployment/catalog model from spec 068.
- Protobuf descriptor API/catalog outputs from spec 066 and earlier Alluxio
  descriptor slices.
- Semgrep local-rule catalog mentions from spec 063.
- Universal Ctags definitions/import/reference-role outputs from specs 059-071.
- Existing compiled-artifact `jdeps` package dependency output from spec 072.
- Bounded duplication and partial symbol-listing outputs from specs 057-058.
