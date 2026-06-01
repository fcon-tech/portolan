# Post-Readiness Stress Refresh

Date: 2026-06-01

Spec: `docs/specs/052-dependency-symbol-evidence-import/`

PR: https://github.com/fcon-tech/portolan/pull/29

Run ID: `20260601-163735`

Target: `/home/fall_out_bug/projects/bigtop-landscape`

Stress directory:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163735`

## Purpose

Refresh the Cursor + Composer 2.5 Bigtop stress evidence after PR #29 was
marked ready-for-review, without starting 053 runtime implementation and
without weakening the 052 merge approval boundary.

## Clean-Start Boundary

- Root `run/` was removed before the lane and remained absent after the lane.
- A fresh stress directory was used.
- Syft was run with source-relative clean-start exclusions:
  `--exclude './.portolan/**' --exclude './run/**'`.
- Cursor + Composer 2.5 was instructed to use only this fresh run and to avoid
  older stress runs, no-Portolan baselines, consolidated reports, prior review
  ledgers, and previous Cursor output files.

## Protocol Correction

The first fresh context was generated before Syft wrote
`context/tool-outputs/syft.cyclonedx.json`. That made `tool-registry.json`
stale: the map could ingest the selected Syft output, but the context registry
still described the pre-producer state.

Correction:

- reran `portolan context prepare --root <target> --out <context> --profile agent --force`;
- verified `context/tool-registry.json` contained one CycloneDX/Syft entry;
- updated the quickstart and clean-start runbook to require this refresh after
  native producer output is written.

This is a protocol/runbook correction, not a new scanner or runtime behavior.

## Selection Correction

An intermediate map attempt reused the target root's stale `selection.json`,
which still pointed at a removed top-level Bigtop corpus manifest path. The
full-corpus gate correctly blocked that run. The comparable stress run used an
18-repository selection derived from the fresh `context/repos.json` plus the
selected Syft `tool_outputs` record. The failed intermediate map output was
removed before the Cursor lane.

## Verified Portolan Metrics

- Repositories: 18
- Graph nodes: 190,748
- Graph edges: 200,203
- Findings: 274
- Relationship-candidate records: 30
- Relationship-candidate families:
  - build-manifest: 18 records, 922 files
  - deployment-manifest: 10 records, 65 files
  - distribution-manifest: 1 record, 1 file
  - rpm-spec: 1 record, 19 files
- Syft/CycloneDX:
  - components: 18,769
  - dependency records: 5,357
- Finding evidence states:
  - source-visible: 156
  - metadata-visible: 5
  - not_assessed: 95
  - unknown: 12
  - cannot_verify: 6

## Cursor + Composer 2.5 Result

Output:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-163735/cursor-composer25-output.md`

Observed result:

- Verdict: Portolan is narrowly materially useful as a local-first navigation
  harness.
- The lane cited only fresh artifacts from run `20260601-163735`.
- The lane named `context/tool-registry.json` and recognized the
  CycloneDX/Syft evidence as `metadata-visible` producer output.
- The lane preserved `not_assessed` for symbol-index, runtime topology,
  service topology, duplication, OpenAPI/AsyncAPI/Backstage/Structurizr, and
  unsupported language semantics.
- The lane did not claim native JVM/PHP/Scala semantics.
- The lane recommended symbol-index, declared API/catalog/model artifacts,
  duplication producer output, curated inventory, and runtime-visible captures
  as the next evidence families.

Contamination check:

- Search of Cursor output found no older run IDs, no no-Portolan baseline
  references, and no consolidated-report references.

## Not Assessed

- Cursor UI behavior outside headless Cursor Agent.
- Real symbol-index output for Java/Scala/Bigtop.
- Real API/catalog/model/runtime producer outputs.
- Full-root duplication evidence.
- Merge approval for PR #29.

## Product Conclusion

This refresh supports the existing 052 conclusion: Portolan is already useful
as a navigation harness and evidence router, but the next improvement should be
more local producer evidence, not Portolan-owned per-language scanners.
