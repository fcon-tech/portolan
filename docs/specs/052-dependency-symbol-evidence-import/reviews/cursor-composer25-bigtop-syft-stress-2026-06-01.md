# Cursor + Composer 2.5 Bigtop Syft Stress

Date: 2026-06-01

Target: `/home/fall_out_bug/projects/bigtop-landscape`

Run ID: `20260601-145759`

Artifacts:
`/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-145759/`

Status: verified clean Portolan-enabled lane; contaminated no-Portolan baseline
recorded; clean no-Portolan baseline recorded; build/deploy candidate
correction accepted; final clean Syft-excluded run verified

## Clean-Start Boundary

- Fresh stress directory was created under `.portolan/stress/20260601-145759/`.
- Root-level `/home/fall_out_bug/projects/bigtop-landscape/run` was removed
  before the lane.
- Cursor prompt explicitly forbade reading root `run`, older stress runs, and
  previous map/report artifacts outside this run ID.
- Cursor raw output was written to
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-145759/cursor-composer25-output.md`.
- A first no-Portolan baseline was contaminated because it inspected
  target-root `selection.json`; it is retained only as degraded evidence at
  `cursor-composer25-no-portolan-baseline-output.md`.
- A clean no-Portolan baseline was rerun against a temporary hardlink copy at
  `/tmp/portolan-052-clean-baseline-20260601-150906/repos`, excluding
  `.portolan/`, `run/`, `selection.json`, graph/map artifacts, and stress
  ledgers. The temporary copy was removed after the lane. Raw output:
  `cursor-composer25-no-portolan-clean-baseline-output.md`.

## Producer Evidence

Syft was run locally and read-only against the Bigtop landscape root:

```text
syft /home/fall_out_bug/projects/bigtop-landscape \
  -o cyclonedx-json=<stress>/context/tool-outputs/syft.cyclonedx.json
```

Result:

- CycloneDX/Syft output size: 28 MB.
- Context registry record:
  `tool-cyclonedx-syft-cyclonedx-json`.
- Components: 18,773.
- Dependency records: 5,358.
- Evidence state: `metadata-visible`.

The 28 MB real output exceeded the original selected-output 16 MB cap. The cap
was raised to 64 MB before the map run, while symbol-index document/symbol
count bounds remain in place.

## Map Result

Map command:

```text
<stress>/portolan map \
  --selection <stress>/selection-with-syft.json \
  --out <stress>/map \
  --force
```

Summary:

- Repositories: 18 visible local repositories.
- Tool outputs: 1 selected SBOM output.
- Graph: 190,752 nodes and 200,209 edges.
- `graph.json`: 157 MB.
- Findings: 274 total.
- Relationships: 99 findings.
- `not_assessed`: 106 findings.
- `cannot_verify`: 6 findings.

Key relationship records:

- `finding-tool-output-bigtop-syft-cyclonedx`: observed
  `metadata-visible` CycloneDX dependency evidence for repository
  `bigtop-landscape`, with 18,773 components and 5,358 dependency records.
- `finding-relationships-symbol-evidence-not-assessed`: no selected local
  symbol-index producer output was available.
- Per-repository non-Go source, runtime inference, lifecycle modeling, and
  service-topology relationship findings remain `not_assessed`.

## Cursor + Composer 2.5 Result

Cursor Agent command used `composer-2.5` in ask mode against the target
workspace and only the fresh run artifacts.

Observed behavior:

- Cursor cited the fresh run and compact artifacts.
- Cursor identified the Syft/CycloneDX SBOM as producer-backed dependency
  evidence, not native JVM/Scala semantics.
- Cursor preserved `not_assessed` for symbol-index, non-Go source
  relationships, runtime inference, service topology, duplication, and missing
  catalog/API/model surfaces.
- Cursor did not claim runtime topology from dependency metadata.
- Cursor recommended the correct next local evidence: curated ecosystem
  manifest, symbol-index for Java/Scala, OpenAPI/AsyncAPI, Structurizr, jscpd,
  Semgrep with local config, per-repo SBOMs, and Backstage catalog if present.

## Assessment

The 052 changes materially improve the navigation harness when standard local
dependency producer output exists. The lane now has real evidence-backed
dependency coverage instead of only broad `not_assessed` relationship wording.

The clean baseline also exposed a navigation gap in the context pack. Without
Portolan artifacts, Cursor found high-value source-visible Bigtop relationship
candidates in `bigtop.bom`, RPM specs, Puppet manifests, and Maven/Gradle/Ivy
build files. The accepted correction is not a Bigtop parser: `context prepare`
now emits bounded `relationship-candidate` records so agents inspect these
build/deploy candidates before raw source while preserving semantic parsing as
`not_assessed`.

Remaining product gap is not another language adapter. It is producer and
candidate evidence: without symbol-index, API/catalog/model/runtime inputs,
Portolan must keep service relationships, non-Go semantic relationships, and
runtime topology as `not_assessed`.

## Not Assessed

- Cursor UI behavior outside headless Cursor Agent.
- Real symbol-index producer output for Java/Scala/Bigtop.
- Runtime topology.
- Complete external ecosystem scope.

## Final Corrected Run

Run ID: `20260601-154329`

Boundary:

- Root `/home/fall_out_bug/projects/bigtop-landscape/run` absent.
- Failed absolute-Syft-exclude run `20260601-154244` removed.
- Syft was run with clean-start exclusions:
  `--exclude './.portolan/**' --exclude './run/**'`.
- Cursor raw output:
  `/home/fall_out_bug/projects/bigtop-landscape/.portolan/stress/20260601-154329/cursor-composer25-output.md`.
- Cursor output contains no older run IDs, baseline artifacts, or no-Portolan
  comparison references.

Context metrics:

- Repositories discovered: 18.
- Relationship-candidate records: 30.
- Candidate counts by family:
  - build-manifest: 18 repo summaries, 922 files.
  - deployment-manifest: 10 repo summaries, 65 files.
  - distribution-manifest: 1 repo summary, 1 file (`bigtop.bom`).
  - rpm-spec: 1 repo summary, 19 files.
- Syft/CycloneDX: 18,769 components, 5,357 dependency records.

Map metrics:

- Graph: 190,748 nodes, 200,203 edges.
- Findings: 274 total.
- Evidence states in findings:
  - `source-visible`: 156
  - `metadata-visible`: 5
  - `not_assessed`: 95
  - `unknown`: 12
  - `cannot_verify`: 6

Cursor + Composer 2.5 result:

- Used final run `20260601-154329` only.
- Named build/deploy candidate counts and limits.
- Preserved build/deploy candidates as `source-visible` navigation hints.
- Preserved non-Go source, runtime topology, service topology, lifecycle,
  symbol-index, duplication, and unsupported language semantics as
  `not_assessed`.
- Did not claim native JVM/PHP/Scala semantics or runtime topology.
