# Feature Specification: Language Agnostic Evidence Producers

**Feature Branch**: `codex/053-language-agnostic-producers`

**Created**: 2026-06-01

**Status**: Merged via PR #30; producer-family schema/fixtures, context
recommendations, evaluation loading, coverage matrix, review-driven fixes, full
local baseline, independent review disposition, GitHub checks, explicit user
merge approval, squash merge, and branch cleanup verified; real producer outputs
beyond 052, post-merge Cursor + Composer 2.5 stress, and GitHub review approval
remain `not_assessed`

**Input**: User description: "If this is a PHP project, or a mixed-language
estate, do we write an adapter for each language? Do not make a JVM adapter the
default. Create the next Portolan spec around a language/tool-agnostic
producer-selection and evidence-import strategy for enterprise landscapes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose Producer Families By Evidence Need (Priority: P1)

A CTO, architect, or agent can ask what local producer evidence would reduce a
relationship, symbol, API/catalog, model, or runtime gap without seeing a
language-specific Portolan adapter recommendation by default.

**Why this priority**: The Bigtop stress run improved dependency evidence but
still left symbol, API/catalog, model, and runtime surfaces as `not_assessed`.
The next product step is to route agents toward the right local evidence
families instead of implying Portolan should own JVM, PHP, Scala, or other
language scanners.

**Independent Test**: Prepare a context pack for a mixed local estate and verify
the producer recommendation surface names missing evidence families, candidate
OSS/local tools, expected output contracts, and unchanged `not_assessed` claims
without recommending a Portolan-owned per-language scanner.

**Acceptance Scenarios**:

1. **Given** a local landscape has PHP Composer files, JVM manifests, shell
   scripts, deployment files, and no symbol-index output, **When** an agent
   reads the context pack, **Then** it sees producer-family recommendations
   such as dependency, symbol-index, API/catalog, deployment/model, or runtime
   observation evidence rather than "write a PHP adapter" or "write a JVM
   adapter".
2. **Given** a relationship question cannot be answered from current Portolan
   evidence, **When** the producer recommendation is generated, **Then** it
   names the blocked claim, the evidence family that would reduce the gap, and
   the state that remains `not_assessed` until local output is supplied.

---

### User Story 2 - Compare OSS Producers Before Adoption (Priority: P2)

A maintainer can evaluate candidate local tools for a producer family, such as
SCIP/LSIF/Serena/Sourcebot/Zoekt for symbol evidence or Backstage/OpenAPI/
AsyncAPI/Structurizr for catalog/model evidence, using the same review fields
before Portolan treats a family as supported.

**Why this priority**: Portolan's product boundary says to compose existing
tools before building scanners. The project needs a repeatable, reviewable
decision surface for tool fit, output contract stability, local execution,
license, privacy, maintenance, and integration cost.

**Independent Test**: Record a candidate evaluation for at least two producer
families and verify each candidate is accepted, narrowed, rejected, blocked, or
`not_assessed` with evidence and no unsupported support claim.

**Acceptance Scenarios**:

1. **Given** multiple symbol-index candidates exist, **When** Portolan records
   producer evaluation, **Then** each candidate has a reviewed fit decision,
   output contract notes, local-only posture, license/maintenance notes, and
   adapter cost.
2. **Given** a candidate requires network, credentials, daemon behavior, or
   target mutation by default, **When** it is evaluated, **Then** it is rejected
   or blocked for Portolan default use unless a later spec explicitly approves
   that boundary.

---

### User Story 3 - Keep Mixed-Language Coverage Honest (Priority: P3)

An agent can answer broad enterprise-landscape questions with a coverage matrix
that distinguishes what is evidence-backed, partially assessed, blocked, or
`not_assessed` across producer families and repositories.

**Why this priority**: Mixed-language estates rarely have one complete tool.
The useful navigation harness behavior is showing coverage and gaps by
producer family, not pretending that one language adapter solves the estate.

**Independent Test**: Generate a context pack or map bundle for a mixed fixture
where dependency evidence exists, symbol evidence is absent, API/catalog
evidence is partial, and runtime evidence is absent; verify the matrix
preserves those states separately.

**Acceptance Scenarios**:

1. **Given** one repository has dependency output and another has only source
   manifests, **When** coverage is reported, **Then** assessed and
   `not_assessed` areas stay separate by repository and evidence family.
2. **Given** local producer output covers only a subdirectory or one language
   family, **When** an answer-contract is generated, **Then** it forbids
   extending that evidence to the whole repository or estate.

### Edge Cases

- A project has PHP Composer evidence but no symbol-index output.
- A JVM-heavy project has Syft/CycloneDX dependency evidence but no complete
  call graph.
- A monorepo has TypeScript, PHP, Java, Scala, shell, Docker, Puppet, and RPM
  surfaces with different producer coverage per directory.
- A candidate producer is mature but requires network access or credentials by
  default.
- A candidate producer is local but its output format is unstable or
  undocumented.
- Two producers disagree about a relationship family.
- Producer output is stale, partial, too large, or generated from the wrong
  root.
- A user asks for "language support" when the real gap is symbol, API/catalog,
  deployment/model, or runtime evidence.
- Cursor or another agent treats recommendation text as proof that an evidence
  family is already assessed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Portolan MUST frame future language coverage as evidence-family
  coverage, not as a default plan to write Portolan-owned adapters for each
  language.
- **FR-002**: Portolan MUST maintain a producer-family recommendation surface
  that maps blocked claims to needed local producer evidence families.
- **FR-003**: Producer families MUST include dependency/component, symbol/
  reference, API/catalog, deployment/model, static finding, duplication, config,
  and runtime-observation categories where applicable.
- **FR-004**: Each recommendation MUST preserve the current claim state as
  `unknown`, `cannot_verify`, or `not_assessed` until a local producer output is
  present and normalized.
- **FR-005**: Recommendations MUST name candidate producer tools or formats as
  options, not as verified support, unless local evaluation evidence exists.
  Candidate entries MUST carry machine-readable verification/support state so
  consumers cannot treat a tool-name list as verified support.
- **FR-006**: Candidate producer evaluation MUST record fit, output contract
  stability, local execution posture, license, maintenance health, privacy
  posture, integration cost, and default boundary risks.
- **FR-007**: A producer requiring network access, credentials, daemon behavior,
  target mutation, or source export MUST be rejected, blocked, or explicitly
  narrowed before it can appear as a default Portolan recommendation.
- **FR-008**: The mixed-language coverage surface MUST report coverage by
  repository, evidence family, and scoped coverage unit, including partial and
  off-scope coverage for subdirectories, components, or language subsets.
- **FR-009**: Portolan MUST NOT treat dependency output, symbol output,
  manifest candidates, or catalog files as runtime topology unless
  runtime-visible local observations are supplied.
- **FR-010**: The answer contract MUST instruct agents not to infer native PHP,
  JVM, Scala, TypeScript, or shell semantics from producer-family
  recommendations alone.
- **FR-011**: The feature MUST update backlog/spec surfaces so report UX work
  depends on evidence-family coverage rather than on language-specific adapter
  claims.
- **FR-012**: The feature MUST include a review disposition before
  implementation that checks product-boundary drift, OSS composition posture,
  and evidence-state honesty.
- **FR-013**: Portolan MUST validate producer-family recommendation,
  evaluation, and coverage records against an allow-listed schema before agents
  or reports consume them.
- **FR-014**: Evaluation records MUST be supplied by an operator or separate
  local evaluation artifact. Portolan may validate and surface those records in
  this slice, but MUST NOT autonomously score, rank, probe, install, or run
  candidate producer tools.

### Key Entities

- **Producer Family**: A category of local evidence that reduces a class of
  claim gaps, such as dependency, symbol/reference, API/catalog,
  deployment/model, static finding, duplication, config, or runtime
  observation.
- **Producer Candidate**: A local tool, export format, or existing artifact
  that may generate a producer-family output.
- **Producer Evaluation**: A reviewed decision about whether a candidate is
  accepted, narrowed, rejected, blocked, or `not_assessed`.
- **Blocked Claim**: A relationship, coverage, topology, ownership, or
  architecture statement that remains weak until a producer family supplies
  local evidence.
- **Coverage Matrix**: A bounded agent-facing summary of assessed, partial,
  blocked, unknown, `cannot_verify`, and `not_assessed` states by repository
  and producer family.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a mixed PHP/JVM fixture or stress target, an agent can identify
  at least three missing producer families and the claims each one would reduce
  without a per-language adapter recommendation.
- **SC-002**: At least two candidate producer families have evaluation records
  with fit, output contract, license/maintenance, privacy, local execution, and
  integration-cost decisions.
- **SC-003**: Generated guidance contains zero positive claims that Portolan
  owns complete PHP, JVM, Scala, TypeScript, shell, or mixed-language semantics.
- **SC-004**: A coverage matrix distinguishes evidence-backed, partial,
  blocked, `unknown`, `cannot_verify`, and `not_assessed` states by repository
  and producer family.
- **SC-005**: If no new producer output is supplied, previously weak runtime,
  symbol, API/catalog, or model claims remain weak and are not counted as
  assessed coverage.

## Assumptions

- PR #29/spec 052 provides the merged dependency and symbol-output import
  baseline this slice builds on.
- This slice may create recommendation and evaluation artifacts before adding
  any new producer normalizer.
- No new dependency, network behavior, daemon, credential handling, target
  mutation, or source export is approved by this spec.
- Candidate tools can be evaluated from local docs, local smoke output, or
  recorded local exports; absence of such evidence is `not_assessed`.
- UX/report polish remains downstream of evidence-family coverage and should
  not convert recommendations into verified support claims.
- Implementation proceeds from T004 after the post-merge gate refresh recorded
  that PR #29 merged and this branch was rebased onto `main`.
