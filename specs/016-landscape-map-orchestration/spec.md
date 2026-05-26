# Feature Specification: Landscape Map Orchestration

**Feature Branch**: `016-landscape-map-orchestration`
**Created**: 2026-05-21
**Status**: Implemented and merged via PR #13 on 2026-05-26; full Bigtop corpus
selection and local map run verified; GitHub checks not_assessed because no
check runs were reported.
**Input**: Product correction: the next Bigtop acceptance case must map the
complete Bigtop software landscape, not a single Bigtop meta-repository. The
result must be a CTO-usable map built from selected local repositories,
metadata, runtime exports, claims, imported OSS tool outputs, and Portolan
skills.

## User Scenarios & Testing

### User Story 1 - Map A Complete Local Landscape (Priority: P1)

A CTO or evaluator can give an agent one local landscape selection and receive
one Portolan artifact bundle covering every selected repository, metadata file,
runtime export, claim file, black-box system, and imported OSS tool output.

**Why this priority**: Portolan's product promise is a map of an incomplete
software landscape. Single-root mapping is a convenience path, not the product
acceptance path.

**Independent Test**: Run `portolan map --selection <selection.json> --out
<run-dir> --force` against a fixture containing at least four repositories with
different stack markers, metadata, claims, black boxes, and imported tool output.
The run writes `run.json`, `summary.json`, `graph.json`, `findings.jsonl`,
`map.md`, and `coverage.json` without network access or target mutation.

**Acceptance Scenarios**:

1. **Given** a local selection with multiple repository targets, metadata,
   runtime, claim, black-box, and imported tool-output inputs, **When** landscape
   map runs, **Then** every selected input appears in coverage output with a
   status, evidence state, and source pointer.
2. **Given** repository targets use different languages or build systems,
   **When** graph and findings are generated, **Then** repository identity stays
   distinct and facts are not collapsed into a single root.
3. **Given** a selected input is missing, unreadable, malformed, or unsupported,
   **When** map runs, **Then** the bundle records `cannot_verify`,
   `unknown`, or `not_assessed` for that input and only fails startup when the
   configured full-corpus gate requires blocking.

### User Story 2 - Prepare Full Bigtop Corpus For Acceptance (Priority: P1)

An evaluator can prepare a full local Apache Bigtop landscape where the Bigtop
meta-repository, every product in the Bigtop inventory, internal support
packages, metadata surfaces, retired projects, and black-box/runtime surfaces
are represented before the blind agent run starts.

**Why this priority**: A partial Bigtop scan would test what happened to be
available locally, not whether Portolan helps a CTO understand a complete
large-scale software landscape.

**Independent Test**: Run the Bigtop corpus preparation workflow from the
committed corpus manifest. The workflow produces a landscape selection and
coverage ledger in which 100% of active or external Bigtop product repositories
are present as local `source-visible` repository targets. Internal support
packages, retired projects, release metadata, binary repositories, Docker
surfaces, and runtime surfaces must also be represented with their correct
evidence states. If any required Bigtop product repository is absent locally,
acceptance is blocked before map execution.

**Acceptance Scenarios**:

1. **Given** the Bigtop corpus manifest names product repositories and metadata
   targets, **When** the preparation workflow runs, **Then** it creates or
   validates a local selection containing the Bigtop meta-repo, every active or
   external product source repository, every support package, every retired
   project, and every declared runtime/package surface.
2. **Given** an active or external Bigtop product cannot be resolved to a local
   source repository, **When** the full-corpus gate runs, **Then** the case is
   blocked before acceptance and the product id is reported as a missing local
   source repository.
3. **Given** all Bigtop inventory entries are represented, **When** the
   landscape map runs, **Then** the output includes a Bigtop coverage section
   proving 100% inventory representation and separating meta-repo evidence from
   product source evidence.

### User Story 3 - Compose OSS Tool Evidence (Priority: P1)

An agent can include local outputs from mature OSS tools in the same landscape
map without Portolan reimplementing every scanner.

**Why this priority**: The expected CTO result depends on code, skills, and OSS
tools together. Portolan's wedge is normalization into honest evidence, not
owning every analyzer.

**Independent Test**: Provide local SBOM, code-size, duplication, and
configuration/dependency tool-output fixtures for multiple repositories. Map
imports those files, records tool attribution, preserves uncertainty, and emits
graph facts or findings without treating tool output as a readiness verdict.

**Acceptance Scenarios**:

1. **Given** a selection names local OSS tool outputs, **When** landscape map
   runs, **Then** every imported fact records tool name, tool version when
   available, input file path, evidence state, and confidence or limitation.
2. **Given** an OSS tool output reports duplicates, dependencies, contracts, or
   configuration surfaces, **When** findings are emitted, **Then** the findings
   cite the imported evidence rather than copying raw private code snippets.
3. **Given** an OSS tool output is malformed, unsupported, or missing, **When**
   map runs, **Then** the relevant surface is recorded as `cannot_verify` or
   `not_assessed` and the rest of the landscape remains inspectable unless the
   full-corpus gate blocks the Bigtop acceptance run.

### User Story 4 - Produce A CTO-Usable Map Packet (Priority: P1)

A CTO can open the generated packet with their own agent and inspect what is
connected, which contracts and surfaces exist, where duplication and legacy
appear, and what remains unknown or unverifiable.

**Why this priority**: The product is useful only if the artifact bundle can be
handed to another agent or human decision-maker without a new manual dig.

**Independent Test**: Review `map.md`, `summary.json`, `coverage.json`,
`graph.json`, and `findings.jsonl` from the full Bigtop landscape run. The
packet contains landscape inventory, repo/product matrix, relationship map,
contract/surface summary, duplication clusters, configuration surfaces,
legacy/debt findings, unknown/cannot-verify ledger, and next-agent tasks, all
backed by artifacts.

**Acceptance Scenarios**:

1. **Given** graph and findings contain relationship, contract, duplication,
   configuration, and debt evidence, **When** `map.md` is generated, **Then** the
   packet groups those facts into CTO-readable sections with graph ids or
   finding ids.
2. **Given** some surfaces are unsupported or unobserved, **When** the packet is
   generated, **Then** it keeps `unknown`, `cannot_verify`, and `not_assessed`
   visible instead of presenting a clean narrative.
3. **Given** another agent receives only the run directory, **When** it reads the
   packet and machine artifacts, **Then** it can identify concrete follow-up
   questions or implementation tasks without re-scanning from scratch.

## Edge Cases

- The Bigtop inventory names an active or external product whose official source
  moved, is archived, or has no obvious single repository; acceptance remains
  blocked until the local source representation is resolved.
- The local product repository exists but is checked out at a ref that differs
  from the Bigtop release BOM version.
- The Bigtop meta-repo contains package metadata for a component but the
  component source repository is missing locally.
- A product is represented by multiple repositories or subprojects.
- A target repository contains nested Git repositories, generated sources,
  vendored dependencies, or very large binary artifacts.
- OSS tool outputs disagree with source-visible evidence.
- OSS tool outputs contain file snippets, suspected secrets, or machine-specific
  absolute paths.
- Selection, corpus manifest, and generated coverage disagree.
- The run output directory is inside one selected repository.
- Cursor, Claude, Codex, OpenCode, pi, or another agent harness can read files
  but cannot execute shell commands.

## Requirements

### Functional Requirements

- **FR-001**: System MUST add `portolan map --selection <selection.json> --out
  <run-dir> [--force]` as the product-grade mapping command for local software
  landscapes.
- **FR-002**: `portolan map --root <dir> --out <run-dir> [--force]` MUST remain
  a backward-compatible shortcut that internally behaves like a one-repository
  selection and MUST NOT be the Bigtop acceptance path.
- **FR-003**: Landscape map MUST read only local filesystem inputs declared by
  the selection or derived from selected local roots; it MUST NOT fetch upstream
  repositories, call live APIs, read credentials, run daemons, or mutate selected
  targets.
- **FR-004**: Landscape map MUST write a complete artifact bundle containing
  `run.json`, `summary.json`, `graph.json`, `findings.jsonl`, `map.md`, and
  `coverage.json`.
- **FR-005**: Startup validation MUST fail without partial output when the
  selection is malformed, the output path is unsafe, selected ids collide, or
  full-corpus gate checks fail.
- **FR-006**: Per-input failures after startup MUST be represented as
  `unknown`, `cannot_verify`, or `not_assessed` findings unless the run profile
  explicitly requires blocking.
- **FR-007**: `coverage.json` MUST list every selected repository, metadata
  file, runtime export, claim file, black-box target, imported tool output, and
  corpus-manifest inventory item with status, evidence state, source path or
  reference, and reason.
- **FR-008**: Graph nodes and edges MUST preserve stable selection ids so
  cross-repository facts can be traced back to the selected landscape inputs.
- **FR-009**: Bigtop full-corpus acceptance MUST require 100% local
  `source-visible` repository coverage for every active or external product
  repository in the committed Bigtop corpus manifest before running the blind
  operator scan.
- **FR-010**: Bigtop internal support packages, retired projects, release
  metadata, binary repositories, Docker surfaces, and runtime surfaces MUST be
  represented with their correct metadata, runtime, claim, unknown, or
  cannot-verify evidence states, but they MUST NOT be used to waive a missing
  active or external product source repository.
- **FR-011**: If any active or external Bigtop product repository is absent from
  the local selection or not source-visible, the Bigtop acceptance run MUST be
  `blocked`; partial coverage MUST NOT be counted as degraded success.
- **FR-012**: The implementation MUST support local imported OSS tool outputs
  for at least SBOM/dependency evidence, code-size or language inventory,
  duplication evidence, and configuration/contract surface evidence.
- **FR-013**: Imported OSS tool facts MUST include source tool attribution,
  input file path, evidence state, and limitations; tool conclusions MUST NOT
  become readiness, modernization, or pass/fail verdicts.
- **FR-014**: Findings MUST cover relationships, contracts/surfaces,
  duplication, configuration, technical debt, unknowns, `cannot_verify`, and
  `not_assessed` in machine-readable JSON Lines.
- **FR-015**: `map.md` MUST be generated from `graph.json`,
  `findings.jsonl`, `coverage.json`, and `run.json`; it MUST NOT introduce
  uncited facts.
- **FR-016**: The agent-facing guide and portable skill MUST prefer
  `map --selection` when a landscape selection is available and MUST describe
  `map --root` only as a single-repository shortcut.
- **FR-017**: The Bigtop quickstart MUST include a full-corpus preparation
  route, a selection-based preflight path, and the stop rule for incomplete
  corpus coverage. Blind target-root acceptance is deferred to spec 017.
- **FR-018**: Baseline verification MUST include `go test ./...`,
  `jq empty schema/*.json`, JSON syntax checks for generated fixtures, and
  `git diff --check`.

### Key Entities

- **Landscape Selection**: Versioned local input file naming repositories,
  metadata, runtime exports, claims, black boxes, and imported tool outputs that
  Portolan may inspect.
- **Corpus Manifest**: Pinned Bigtop inventory and official references used to
  define what full coverage means.
- **Coverage Ledger**: Machine-readable report proving which selected and
  manifest-required inputs were visible, missing, unsupported, unverifiable, or
  blocked.
- **Imported Tool Output**: Local file produced by an external OSS tool and
  normalized into graph facts or findings with attribution.
- **Landscape Artifact Bundle**: `run.json`, `coverage.json`, `summary.json`,
  `graph.json`, `findings.jsonl`, and `map.md` generated from one map run.
- **CTO Packet**: Human-readable `map.md` sections derived from machine
  artifacts for architecture, contracts, duplication, legacy, gaps, and
  next-agent work.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A multi-repo fixture with at least four repositories, metadata,
  claims, black boxes, and imported tool outputs maps successfully with
  `portolan map --selection` and writes all five required artifacts.
- **SC-002**: A Bigtop landscape selection generated or validated from
  `corpora/apache-bigtop/manifest.json` reaches 100% local source-repository
  coverage for active and external product repositories before the blind
  operator scan starts.
- **SC-003**: A deliberately incomplete Bigtop landscape selection blocks
  acceptance before scan execution and records the missing active or external
  product repository ids.
- **SC-004**: `coverage.json` and `map.md` agree on selected input counts,
  represented Bigtop inventory counts, missing/blocked counts, and evidence-state
  counts.
- **SC-005**: At least one local imported OSS tool output contributes a
  dependency/SBOM fact, one contributes a duplication finding, one contributes a
  language/size inventory fact, and one contributes a configuration or contract
  surface finding.
- **SC-006**: The generated CTO packet contains artifact-backed sections for
  landscape inventory, repo/product matrix, relationships, contracts/surfaces,
  duplication, configuration, legacy/debt, unknowns, and next-agent tasks.
- **SC-007**: No generated artifact contains raw secret values or uncited
  architecture conclusions.
- **SC-008**: The same selection run twice over unchanged inputs produces stable
  ids and comparable coverage/finding counts.

## Assumptions

- The default map profile remains local-first and read-only.
- Full Bigtop corpus preparation may use networked clone/fetch/setup steps only
  before the blind map run and only through explicit operator action outside the
  default map execution path.
- The first implementation may import local fixture outputs for some OSS tool
  families while documenting exact supported formats, but the full Bigtop
  acceptance run must use real local outputs for the selected Bigtop landscape.
- JSON remains the first contract format for selections, manifests, coverage,
  graph, findings, and run metadata.
