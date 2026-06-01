# Research: Real Producer Output Proof

## Decision: Treat Generated Producer Outputs As External Evidence

Rationale: The product boundary says Portolan composes existing tools and
normalizes evidence. Docker Compose, Helm, and protoc can generate local model
or API artifacts without Portolan owning those producer workflows.

Alternatives considered:

- Add `portolan produce compose/helm/protoc`: rejected because PR #31 and spec
  053 reinforced that Portolan must not become a scanner/runtime harness.
- Treat source files directly as verified producer output: rejected because
  source-visible candidates are not the same as generated producer evidence.

## Decision: Start With Bounded Deployment/API Outputs

Rationale: The initial Bigtop reconstruction verified three safe bounded
outputs:

- Docker Compose config JSON for `apache-bigtop-repo`;
- Helm rendered YAML for the Alluxio monitor chart;
- protobuf descriptor output for bounded Alluxio gRPC protos.

These prove non-Syft producer-output acquisition without requiring network,
daemon behavior, credentials, or target mutation.

Alternatives considered:

- Full symbol-index proof first: blocked because SCIP/LSIF/ctags/Sourcebot/
  Zoekt are not installed locally.
- Full runtime topology first: rejected because no runtime-visible observation
  artifact exists and starting Bigtop services is not approved by default.

## Decision: Add Producer-Run Metadata Before New Import Semantics

Rationale: Before Portolan can safely use externally generated outputs, agents
need durable provenance: command/source, target root, output path, freshness,
scope, tool family, and weak/verified state. This is smaller and safer than
adding full parsers for every output format.

Alternatives considered:

- Parse every new output deeply in one slice: rejected as broad and likely to
  create false architecture claims.
- Store only file paths in `tool-registry.json`: rejected because it loses
  command provenance, environment requirements, and evidence boundaries.

## Decision: Runtime Topology Stays Out Of Scope

Rationale: Docker Compose, Helm, and protobuf descriptors are static
deployment/API/model evidence. They can improve architecture navigation but do
not prove runtime behavior.

Alternatives considered:

- Infer runtime topology from Compose/Helm: rejected as evidence-state
  laundering.
- Start containers to observe runtime: blocked pending explicit design approval
  because it can require daemon behavior, network, credentials, and target
  mutation.

## Decision: Cursor Stress Is Required But Not Sufficient

Rationale: Cursor + Composer 2.5 must consume the refreshed Portolan context to
show agent value. But an improved answer is only verified for claims backed by
local producer evidence and a review rubric.

Alternatives considered:

- Count Cursor's plausible answer as architecture proof: rejected.
- Defer Cursor until all producer families exist: rejected because early stress
  is useful for finding answer-contract gaps.
