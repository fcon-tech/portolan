# BDD Work Package: Landscape Intelligence And Producers

> Supporting note only. For the next implementation pass,
> `07-portolan-core-product-spec.md` is the controlling specification. If this
> file conflicts with `07`, follow `07`.

## Agent Assignment

Define and validate the facts that make the atlas useful. Prefer mature OSS
outputs and simple local metadata over Portolan-owned scanners.

## Product Question

What must Portolan collect so the captain sees real landscape intelligence, not
empty graph nodes?

## Required Fact Families

- Repository inventory and ownership hints.
- Languages, package managers, build systems, and module boundaries.
- Components and service-like surfaces.
- Cross-repo and intra-repo relationships.
- Configuration, secrets-reference, CI/CD, deployment, and infrastructure
  surfaces.
- Documentation and code-vs-doc contradictions.
- Duplication, large hotspots, generated/vendor/test pollution, and code smell
  candidates.
- Runtime observations only when supplied or safely captured with approval.
- Unknown, partial, and cannot-verify areas.

## Candidate Producers

- Git and filesystem inventory.
- Package manifests and lockfiles.
- ctags or comparable symbol index.
- Semgrep local rules.
- jscpd or CPD-style duplication.
- Syft or CycloneDX SBOM.
- CodeGraph, ast-index, SCIP/LSIF, or other graph/index producers when they
  prove useful.
- Understand Anything only if its outputs can be made inspectable and useful.
- Backstage, OpenAPI, AsyncAPI, protobuf, Compose, Helm, Terraform, and CI
  descriptors as metadata surfaces.

## Implementation Slice

- Owned surfaces: fact-family matrix, producer adapter notes, bundle field
  contract, and producer result summaries.
- First vertical slice: repo inventory, language/build hints, component-like
  surfaces, relationship records with source family, and attached gaps.
- Artifact: matrix that maps each required fact family to producer, bundle
  fields, failure state, license/privacy/runtime notes, and captain value.
- Verify: run or inspect a generated bundle and show that successful producers
  appear in the atlas while failed or missing producers produce visible gaps.
- Out of scope: custom scanner builds until an OSS/import path has been rejected.

## BDD

```gherkin
Feature: Atlas contains useful landscape facts

Scenario: Repositories and components are identified
  Given a multi-repo target
  When Portolan builds the atlas bundle
  Then every visible repo has a stable id, path, language/build hints, and summary facts
  And service-like or package-like components are extracted when local evidence supports them

Scenario: Relationships are shown with source type
  Given dependency, import, descriptor, config, or deployment evidence exists
  When Portolan emits relationships
  Then each relationship records its source family and limitation
  And relationships from weak evidence do not look equivalent to precise runtime links

Scenario: Risks are actionable
  Given duplication, config, dependency, symbol, or static-analysis signals exist
  When Portolan emits risks or smells
  Then each risk explains why it matters to a captain
  And each risk links to affected repos/components/files and next inspection steps

Scenario: Producer failures preserve partial value
  Given one producer is missing, slow, or fails
  When the atlas build completes
  Then successful producers still contribute visible facts
  And missing coverage is attached to affected fact families
  And the captain can distinguish missing data from clean results

Scenario: OSS tools are integrated before custom scanners are built
  Given an existing local tool can produce a useful fact family
  When Portolan needs that fact family
  Then the work package evaluates wrapping or importing that tool before building native analysis
```

## Deliverables

- Fact-family matrix with producer candidates.
- Minimal bundle fields required by the atlas app and Q&A layer.
- Producer comparison notes: fit, maintenance, license, privacy, runtime cost,
  output stability, and integration cost.
- Bigtop and non-JVM corpus result summaries.

## Acceptance

Pass when the atlas can explain a large target with enough facts for the captain
to identify real repos, components, relationships, risks, and gaps without
reading raw scanner output.
