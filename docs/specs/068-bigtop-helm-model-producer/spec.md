# Feature Specification: Bigtop Helm Model Producer

**Feature Branch**: `codex/068-bigtop-helm-model-producer`

**Created**: 2026-06-02

**Status**: Merged via PR #46

**Input**: The broader goal requires real model/catalog producer outputs beyond
Syft/CycloneDX. The local Bigtop landscape contains the Apache Airflow Helm
chart, which can be rendered read-only with Helm to produce Kubernetes
desired-state model evidence without contacting a cluster.

## User Scenarios & Testing

### User Story 1 - Generate Kubernetes Model Output (Priority: P1)

A maintainer can inspect rendered Kubernetes manifests from a real Bigtop
landscape Helm chart.

**Independent Test**: `helm template` output, stderr, exit code, hashes, sizes,
and resource summaries are recorded externally.

### User Story 2 - Preserve Desired-State Boundary (Priority: P1)

A maintainer can distinguish rendered Kubernetes desired state from live
runtime topology.

**Independent Test**: The ledger classifies Helm output as `metadata-visible`
deployment/catalog model evidence and keeps runtime topology as
`cannot_verify`.

### User Story 3 - Make Runtime Comparison Points Concrete (Priority: P1)

A maintainer can see which workload and Service surfaces would need runtime
validation later.

**Independent Test**: Resource kind counts, workloads, and Services are
summarized from the rendered output.

## Requirements

- **FR-001**: The feature MUST use Helm's standard `template` producer output
  rather than parsing chart templates by hand.
- **FR-002**: The feature MUST NOT contact a Kubernetes cluster, install a Helm
  release, or mutate target repositories.
- **FR-003**: The feature MUST record rendered manifest output, stderr, exit
  code, chart metadata, hashes, sizes, and resource summaries.
- **FR-004**: The feature MUST classify rendered manifests as
  `metadata-visible` desired-state evidence, not `runtime-visible` topology.
- **FR-005**: Runtime topology MUST remain `cannot_verify` until live
  Kubernetes/Docker/process observations exist.
- **FR-006**: Cursor stress MUST preserve the desired-state/runtime boundary.

## Success Criteria

- **SC-001**: Helm version is recorded.
- **SC-002**: `helm template` exits `0` and emits rendered manifests.
- **SC-003**: Resource summaries include kind counts, workload names, and
  Service names.
- **SC-004**: Cursor stress preserves runtime topology and enterprise parity as
  `cannot_verify`.
- **SC-005**: Local baseline checks pass before PR readiness.

## Out Of Scope

- Installing or upgrading a Helm release.
- Running `kubectl apply`, contacting a cluster, or starting runtime workloads.
- Proving live Airflow or Bigtop runtime topology.
- Adding Helm import code to Portolan.
- Claiming full architecture parity.

## Assumptions

- The chart path is
  `/home/fall_out_bug/projects/bigtop-landscape/repos/apache-airflow/chart`.
- The render uses release name `portolan-airflow` and namespace
  `portolan-airflow`.
- Rendered Kubernetes manifests are committed only as external stress evidence;
  repo artifacts record summaries and hashes.
