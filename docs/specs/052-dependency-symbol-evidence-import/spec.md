# Feature Specification: Dependency And Symbol Evidence Import

**Feature Branch**: `codex/052-dependency-symbol-evidence-import`

**Created**: 2026-06-01

**Status**: Local implementation, review, and final Cursor stress verified; PR
not_started

**Input**: User description: "Create the next Portolan spec as a
format-oriented dependency and symbol evidence import slice. Do not build
per-language scanners. Use JVM/Bigtop, PHP, and mixed-language landscapes as
acceptance cases for standard producer outputs and honest gaps."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Close Relationship Gaps With Standard Evidence (Priority: P1)

A CTO, architect, or agent can run Portolan on a large local landscape and see
dependency or symbol relationship claims backed by local producer evidence
instead of broad `not_assessed` placeholders.

**Why this priority**: The Bigtop stress test showed that Portolan is useful
but weak when a Java-heavy landscape lacks imported dependency and symbol
evidence. Report UX polish should not come before stronger evidence coverage.

**Independent Test**: Provide a local landscape with dependency or symbol
producer output and verify relationship findings name the evidence source,
relationship kind, target scope, and remaining gaps.

**Acceptance Scenarios**:

1. **Given** a local landscape has standard dependency evidence for multiple
   repositories, **When** Portolan maps the landscape, **Then** relationship
   findings cite the local producer artifacts and are no longer reported only
   as `not_assessed`.
2. **Given** a local landscape has standard symbol or reference evidence,
   **When** Portolan prepares agent context, **Then** the context pack shows
   which repositories have symbol-backed relationship evidence and which do
   not.

---

### User Story 2 - Support PHP And Mixed-Language Landscapes Without Scanner Sprawl (Priority: P2)

A maintainer can onboard a PHP project or mixed-language estate without adding
a Portolan-owned analyzer for every language. Portolan should normalize
standard local evidence when it exists and keep unsupported language-specific
semantics visible as gaps when it does not.

**Why this priority**: The product must scale beyond the JVM-heavy Bigtop case.
A per-language adapter strategy would turn Portolan into an incomplete clone of
mature code-intelligence tools.

**Independent Test**: Run the same evidence-import contract against fixtures or
recorded outputs from at least two different language ecosystems and confirm
the report explains evidence coverage by producer output, not by Portolan
language ownership.

**Acceptance Scenarios**:

1. **Given** a PHP project provides dependency evidence from local package
   metadata, **When** Portolan maps the project, **Then** package and
   dependency relationships are represented with local evidence references.
2. **Given** a mixed-language landscape has evidence for some ecosystems but
   not others, **When** Portolan reports relationship coverage, **Then** it
   distinguishes evidence-backed areas from `not_assessed` areas without
   claiming full language coverage.

---

### User Story 3 - Give Agents A Safe Next-Action Surface For Missing Evidence (Priority: P3)

An agent can inspect a map or context bundle and see which missing producer
outputs would improve relationship evidence, without inventing claims or
loading the full graph first.

**Why this priority**: Portolan's value is strongest when it guides agents from
unknowns to concrete local evidence collection steps while preserving weak
states.

**Independent Test**: Generate a context bundle with partial or absent producer
evidence and verify the gap surface names missing evidence families, affected
repositories, and the claims that remain blocked.

**Acceptance Scenarios**:

1. **Given** no dependency or symbol producer output is present, **When** an
   agent reads the context bundle, **Then** dependency and symbol relationships
   remain `not_assessed` and the bundle lists the missing evidence families.
2. **Given** producer output is malformed, stale, oversized, or only partially
   scoped, **When** Portolan reports the result, **Then** the degraded state is
   visible and does not count as assessed relationship evidence.

### Edge Cases

- A landscape has dependency evidence but no symbol evidence.
- A landscape has symbol evidence for one repository and only package metadata
  for another.
- Producer output is valid but covers only a selected subdirectory.
- Two producer outputs disagree about a dependency or symbol relationship.
- Producer output includes generated, vendored, or external-library paths.
- Producer output is too large for direct agent context.
- A relationship is metadata-visible or source-visible but not runtime-visible.
- A package or module name is ambiguous across repositories.
- A producer artifact exists under a legacy comparison directory that should
  not contaminate a no-Portolan baseline.
- A user expects PHP, JVM, or another language family to be fully understood
  without supplying local language-aware producer evidence.
- Useful build/deploy relationship hints exist in source files such as
  `pom.xml`, Gradle files, `bigtop.bom`, RPM specs, Puppet manifests, or
  compose files, but no approved parser has normalized their semantics.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Portolan MUST treat dependency and symbol intelligence as local
  evidence imported from standard producer outputs, not as a commitment to
  Portolan-owned per-language scanners.
- **FR-002**: Portolan MUST normalize dependency relationships from recognized
  local package, manifest, lockfile, dependency tree, or component evidence
  into relationship records with source references.
- **FR-003**: Portolan MUST normalize symbol, reference, or code-navigation
  relationships from recognized local symbol-index evidence into relationship
  records with source references.
- **FR-004**: Each imported relationship MUST identify relationship kind,
  evidence state, repository scope, source artifact, and whether the evidence
  came from dependency, symbol, component, or static-analysis evidence.
- **FR-005**: Missing producer output MUST remain visible as `not_assessed`;
  missing evidence MUST NOT be collapsed into success, failure, or silence.
- **FR-006**: Portolan MUST distinguish dependency, symbol/reference,
  component, static finding, and runtime relationship evidence in generated
  findings and agent context.
- **FR-007**: Portolan MUST NOT claim complete language, architecture, service,
  or runtime topology coverage from dependency or symbol evidence alone.
- **FR-008**: Portolan MUST provide a bounded relationship-evidence summary for
  agents so they can inspect evidence coverage without loading the full graph.
- **FR-009**: Portolan MUST report producer coverage by repository and evidence
  family so mixed-language landscapes can show partial coverage honestly.
- **FR-010**: Portolan MUST support PHP and JVM-heavy acceptance cases through
  the same producer-output contract rather than a PHP-specific or JVM-specific
  scanner ownership model.
- **FR-011**: Malformed, stale, oversized, off-scope, or untrusted producer
  outputs MUST be labeled as degraded evidence and MUST NOT count as assessed
  relationship coverage.
- **FR-012**: New producer families MUST include license, maintenance, privacy,
  and local-read-only boundary review before being presented as supported
  evidence families.
- **FR-013**: Agent-facing gaps MUST name which relationship claims remain
  blocked and what kind of local producer evidence would be needed to assess
  them.
- **FR-014**: Baseline comparison guidance MUST prevent legacy Portolan or
  root-level run artifacts from contaminating no-Portolan lanes.
- **FR-015**: Context preparation MUST surface bounded source-visible
  build/deploy relationship candidates when common manifest filenames are
  present, while making clear that semantic parsing and runtime topology remain
  `not_assessed`.

### Key Entities

- **Evidence Producer Output**: A local artifact generated outside Portolan
  that describes dependencies, components, symbols, references, or static
  findings.
- **Normalized Relationship Evidence**: A Portolan relationship record derived
  from a producer output and labeled with relationship kind, evidence state,
  scope, and source reference.
- **Evidence Family**: A category of evidence such as dependency, symbol,
  component, static finding, or runtime observation.
- **Coverage Record**: A statement of which repositories and evidence families
  were assessed, partially assessed, failed, or not assessed.
- **Gap Recommendation**: A bounded next-action hint that names missing local
  evidence needed before a relationship claim can be assessed.
- **Relationship Candidate**: A bounded source-visible context record that
  points at likely build/deploy relationship evidence locations but is not a
  parsed relationship claim.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a JVM-heavy acceptance landscape with local dependency or
  symbol evidence, at least one previously `not_assessed` relationship family
  becomes evidence-backed with source references.
- **SC-002**: On a PHP or mixed-language acceptance case, relationship coverage
  is reported by evidence family and repository without any claim that Portolan
  owns full language semantics.
- **SC-003**: When dependency and symbol producer outputs are absent, an agent
  can identify the missing evidence family and affected repositories from a
  bounded summary without opening the full graph.
- **SC-004**: Every positive relationship claim generated by this feature has a
  local evidence reference or is rejected by the report-quality boundary.
- **SC-005**: Degraded producer outputs are visible as failed, blocked, or
  `not_assessed` evidence and do not count toward assessed relationship
  coverage.
- **SC-006**: Product documentation and agent guidance avoid per-language
  scanner ownership wording for this feature.

## Assumptions

- Portolan remains local-first and read-only by default.
- Portolan imports and normalizes local evidence; external producer execution
  remains native-tool, skill, or user-owned unless a later spec approves a
  bounded execution surface.
- When a producer output exists but cannot be parsed, bounded, trusted, or
  scoped enough for this feature, the affected producer evidence is
  `cannot_verify`. When no producer output exists for a relationship family,
  that family remains `not_assessed`.
- Imported producer outputs may contain local paths, package identifiers,
  symbol names, registry URLs, or hashes. This slice treats those values as
  local-only evidence metadata and does not add any network, export, or
  redaction surface.
- JVM/Bigtop is an acceptance corpus for a proven gap, not the product
  boundary.
- PHP and mixed-language examples are used to validate the format-oriented
  model.
- The next scan-report UX slice should depend on this evidence-import slice
  when it wants to make stronger relationship claims.
