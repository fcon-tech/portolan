# Feature Specification: E2E Agent Scan Report

**Feature Branch**: `codex/052-agent-scan-report-ux`

**Created**: 2026-06-01

**Status**: Draft

**Input**: User description: "A user opens a coding agent, opens one repository
or a folder with multiple repositories, asks the agent to scan it, and receives
a useful report covering stack, relationships, architecture diagrams,
duplication, and technical debt."

**Dependency**: `specs/051-portolan-quality-boundary/` defines the product
quality, maturity, trust, and report-quality boundary that this UX workflow must
respect.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Get A First Useful Report (Priority: P1)

A non-expert user opens a repository or local landscape in an agent harness,
asks for a scan, and receives one readable first report without needing to know
Portolan artifact names, command sequencing, or evidence-state vocabulary.

**Why this priority**: This is the product's first useful moment. If the user
only receives commands, artifact paths, or a weak "nothing useful found" answer,
the product has failed even when lower-level graph artifacts were generated.

**Independent Test**: In a clean agent-like local session, run one documented
scan-report request against a synthetic repository landscape and verify the
final report includes scope, stack, relationships or relationship gaps,
architecture diagram, duplication, technical-debt candidates, unknowns, and
next actions with evidence references.

**Acceptance Scenarios**:

1. **Given** a local repository or folder of repositories is open, **When** the
   user asks the agent to scan it, **Then** the agent can run one Portolan
   workflow and return a human-readable report without asking the user to pick
   internal artifacts.
2. **Given** Portolan observes exact duplication or configuration/debt
   candidates, **When** the report is generated, **Then** those findings appear
   in the report with stable evidence references.
3. **Given** Portolan cannot verify runtime topology, complete architecture, or
   near-clone duplication, **When** the report is generated, **Then** the report
   keeps those surfaces explicit as `unknown`, `cannot_verify`, or
   `not_assessed` instead of hiding them.

---

### User Story 2 - Understand Architecture And Relationships (Priority: P2)

A technical leader can use the first report to understand visible stack
composition, repositories, declared/source-visible relationships, and at least
one architecture diagram or diagram-ready model without reading raw JSON.

**Why this priority**: The requested report is not only a findings list. It
must help a human orient inside a codebase or local software landscape.

**Independent Test**: Run the report workflow against a multi-repo fixture with
multiple languages, manifests, API/config surfaces, and at least one missing
relationship family; verify the report contains a visible-stack section,
relationship section, architecture diagram, and gap section.

**Acceptance Scenarios**:

1. **Given** the target has package manifests, source files, workflows, API
   contracts, or local architecture metadata, **When** the scan report is
   produced, **Then** the report summarizes visible stack and relationship
   evidence separately from inferred or missing relationship evidence.
2. **Given** no complete runtime topology is supplied, **When** the report
   includes an architecture diagram, **Then** the diagram labels it as
   source/metadata-visible or partial rather than complete runtime truth.

---

### User Story 3 - Reduce The Next Step To A Short Action Plan (Priority: P3)

After reading the report, the user knows what to inspect or run next and which
claims are safe to repeat.

**Why this priority**: A report that only lists evidence is still too
operator-centric. The user needs an actionable first conversation with the
agent.

**Independent Test**: Review the generated report and verify it ends with a
ranked next-action list that reduces the most important unknowns without
network access, repository mutation, credentials, or unsupported commands.

**Acceptance Scenarios**:

1. **Given** richer evidence requires optional local producers, **When** the
   report is generated, **Then** it names the exact safe next producer or query
   command from Portolan artifacts and records whether approval is required.
2. **Given** the current evidence is thin, **When** the report is generated,
   **Then** it still explains why the answer is thin and what local evidence
   would improve it.

### Edge Cases

- The opened folder is a single repository, a multi-repo landscape, or a mix of
  Git repositories and non-Git child directories.
- The target uses a stack Portolan does not deeply understand.
- The target has no package manifests, no local architecture metadata, or no
  duplication findings.
- Optional OSS producers such as jscpd, Syft, Semgrep, Graphify, or Repomix are
  absent, installed, or present only as prior local outputs.
- The target is large enough that the agent must use bounded summaries and
  slices instead of loading `graph.json` first.
- The agent harness supports different instruction formats, but the Portolan
  workflow must remain harness-independent.
- Generated reports must not expose secret values, credentials, or private
  source snippets beyond local evidence references.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Portolan MUST expose a single E2E scan-report workflow for an
  agent-facing user request over `--root <target-root>` and an explicit output
  directory.
- **FR-002**: The workflow MUST preserve local-first and read-only defaults:
  no network calls, no daemon behavior, no credentials, no target repository
  mutation, and writes only under the selected output directory.
- **FR-003**: The workflow MUST produce a human-readable report artifact and a
  machine-readable report summary derived from the same local evidence used by
  existing context, map, finding, and query surfaces.
- **FR-004**: The report MUST include these sections: run status, visible
  scope, visible stack, relationships and architecture, duplication,
  configuration surfaces, technical-debt candidates, unknowns/gaps, and ranked
  next actions.
- **FR-005**: The report MUST include at least one architecture diagram or
  diagram-ready representation when repository or relationship evidence exists;
  partial diagrams MUST be labeled with evidence boundaries.
- **FR-006**: The report MUST cite stable evidence references for positive
  findings, including finding IDs, artifact paths, or `portolan://` references
  where available.
- **FR-007**: The workflow MUST not upgrade missing evidence into success:
  `unknown`, `cannot_verify`, and `not_assessed` surfaces must remain visible
  in both the report and machine-readable summary.
- **FR-008**: The workflow MUST summarize visible stack evidence from local
  source files, manifests, workflows, contracts, and imported/local tool outputs
  without claiming full semantic stack understanding.
- **FR-009**: The workflow MUST summarize exact native duplication findings and
  distinguish them from near-clone or component duplication surfaces that
  require optional local OSS evidence.
- **FR-010**: The workflow MUST provide safe next commands only from existing
  Portolan commands, generated plan artifacts, or approved local producer
  recipes; it MUST NOT invent command shapes.
- **FR-011**: The workflow MUST support both a single repository and a folder
  containing multiple local repositories through the same user-facing request.
- **FR-012**: The workflow MUST be usable from a generic coding-agent harness;
  Cursor-specific docs may exist as an example, but the product contract must
  not depend on Cursor.
- **FR-013**: The workflow MUST include an acceptance harness that exercises the
  E2E story on at least three local targets: a synthetic multi-repo fixture, a
  real public single-repo target, and a real public multi-repo or landscape
  target.
- **FR-014**: The acceptance harness MUST fail if the report omits any required
  section, contains unsupported positive claims, hides weak evidence states, or
  lacks a ranked next-action list.
- **FR-015**: Existing lower-level artifacts (`context`, `map`, `findings`,
  `graph-index`, `query`, and optional producer records) MUST remain available;
  the E2E report is an entrypoint over them, not a replacement truth source.
- **FR-016**: Harness-facing scan-report instructions MUST have one canonical
  source and generated or checked adapters for supported harnesses; static
  adapter presence MUST NOT be treated as runtime readiness.
- **FR-017**: The first report MUST be saved as Markdown and the agent workflow
  MUST instruct the agent to summarize or relay that Markdown report in the
  chat response.
- **FR-018**: The v1 architecture diagram format MUST be Mermaid in Markdown
  unless implementation discovers a blocking renderer or compatibility issue.

### Key Entities

- **Scan Request**: The target root, output directory, profile, timestamp, and
  harness-facing instruction that starts the workflow.
- **Scan Run**: The executed local commands, generated artifact paths, command
  statuses, warnings, and blockers.
- **Evidence Bundle**: The context pack, map bundle, finding records, graph
  indexes, coverage records, query results, and local OSS/tool outputs used by
  the report.
- **First Report**: The human-readable report returned to the user and saved as
  an artifact.
- **Report Summary**: A machine-readable summary of report sections, evidence
  references, weak states, and next actions.
- **Architecture Diagram**: A visual or diagram-ready representation of visible
  repositories and relationships, with evidence-state labels.
- **Acceptance Lane**: A repeatable local target plus prompt/runbook that
  verifies the E2E user story.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time agent user can issue one scan-report request and get
  a complete first report in under ten minutes on the synthetic multi-repo
  fixture.
- **SC-002**: The generated report contains all required sections for every
  acceptance target, even when some sections say `not_assessed` or `unknown`.
- **SC-003**: Every positive finding in the report has at least one local
  evidence reference.
- **SC-004**: The acceptance harness records zero unsupported positive claims
  for the required report sections.
- **SC-005**: The report includes at least three ranked next actions, each tied
  to a local Portolan command, existing artifact, or explicit user-supplied
  evidence need.
- **SC-006**: The E2E workflow supports both single-repo and multi-repo local
  roots without a curated selection file.

## Assumptions

- Cursor is the first demonstration harness because it is familiar to the
  reported customer, but the contract is harness-independent.
- The first implementation should add an E2E report surface over existing
  Portolan artifacts before adding new stack-specific analyzers.
- Architecture diagrams start as Mermaid in Markdown and must label evidence
  boundaries.
- Optional local OSS producers improve evidence depth but are not required for
  the first useful report.
- The feature is not complete when only documentation is updated; it needs
  runnable local acceptance evidence.
- Spec 052 must not claim UX readiness unless the quality/report contract from
  spec 051 is satisfied or explicitly marked `not_assessed`.
