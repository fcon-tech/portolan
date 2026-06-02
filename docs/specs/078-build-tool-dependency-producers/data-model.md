# Data Model

## BuildToolSurface

- `family`: `maven` or `gradle`
- `manifest_count`: number of visible matching build manifests
- `sample_paths`: bounded list of sample local paths
- `scope`: `landscape`
- `evidence_state`: `source-visible`

Validation:

- Count only local files discovered under repository roots.
- Samples must be paths, not file contents.
- The surface is evidence of build-tool presence only, not dependency facts.

## BuildToolProducerPlan

- `id`: `maven-cyclonedx` or `gradle-cyclonedx`
- `family`: `cyclonedx`
- `producer`: native build-tool/CycloneDX producer name
- `status`: `available_not_run`, `not_available`, `not_assessed`, or
  `input_present`
- `evidence_state`: `not_assessed` unless a local output already exists
- `commands`: optional approval-gated command recipes
- `limits`: network/cache/build/output boundary notes

Validation:

- Command writes must stay under the context `tool-outputs` directory.
- `requires_user_approval` must be true.
- `mutates_target` must be true or risk-disclosed when build tools may write
  target or cache state.
- `network` must not be `not_expected`; build-tool dependency resolution can
  require network unless the operator has a prepared offline cache.

## DependencyEvidenceOutput

- Local CycloneDX/build-tool output file.
- Future selected `tool_outputs[].kind` should use `dependency` or `sbom` when
  the output is CycloneDX-compatible.
- Evidence is `metadata-visible`.

Validation:

- Missing output remains `not_assessed`.
- Malformed output becomes `cannot_verify`.
- Dependency metadata does not prove runtime topology, callgraph, or complete
  architecture parity.
