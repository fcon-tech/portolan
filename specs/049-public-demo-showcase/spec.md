# Feature Specification: Public Demo Showcase

**Feature Branch**: `codex/049-public-demo-showcase`

**Created**: 2026-05-30

**Status**: Implemented locally; public runbook, redacted excerpts, fresh local
smoke evidence, claim scan, privacy/freshness review, and baseline checks are
recorded; PR review pending

**Input**: User description: "Specs for a public showcase/popularization path."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Run A Public Apache Bigtop Demo (Priority: P1)

A public evaluator can run Portolan against an Apache Bigtop checkout or
documented local Bigtop landscape and see the artifact bundle that an agent
would use before answering codebase questions.

**Why this priority**: Popularization needs a visible proof path. The demo must
show Portolan's actual evidence discipline, not a marketing page that hides
unknowns.

**Independent Test**: From a fresh checkout, follow `docs/demo.md`, prepare the
documented Apache Bigtop target, and produce or inspect a demo output with
`summary.json`, `map.md`,
`evidence-index.jsonl`, and `answer-contract.md`.

**Acceptance Scenarios**:

1. **Given** a user has a source checkout, **When** they run the demo command,
   **Then** Portolan writes artifacts under an explicit local output directory.
2. **Given** Apache Bigtop is a large multi-repo stress target, **When**
   artifacts are rendered, **Then** they show visible evidence, gaps, and weak
   states instead of a fake all-green result.

---

### User Story 2 - Read A Claim-Bounded Case Study (Priority: P2)

A CTO or staff engineer can read a short public case study that explains the
value of Portolan without overgeneralizing the fixed local Bigtop/Cursor
evidence.

**Why this priority**: Portolan's public story is strongest when it shows fewer
unsupported agent claims, but that result is currently narrow and must be
framed honestly.

**Independent Test**: Compare case-study wording with `docs/product-claims.md`
and confirm every claim is accepted or narrowed.

**Acceptance Scenarios**:

1. **Given** the case study mentions the Bigtop comparison, **When** a reviewer
   checks the wording, **Then** it says fixed local headless Cursor comparison
   and does not claim UI Cursor/Composer validation.
2. **Given** the case study mentions OSS adapters, relationships, duplication,
   or security, **When** a reviewer checks wording, **Then** the exact validated
   scope and `not_assessed` areas remain visible.

---

### User Story 3 - Share Artifacts Without Leaking Private Context (Priority: P3)

A maintainer can publish demo artifacts, screenshots, or terminal recordings
without exposing private paths, credentials, customer code, or stale outputs as
current verification.

**Why this priority**: A showcase is a public artifact. It must be safe to share
and reproducible enough to trust.

**Independent Test**: Inspect committed demo files and generated artifacts for
private paths, tokens, credentials, external customer names, and unsupported
freshness claims.

**Acceptance Scenarios**:

1. **Given** demo outputs are committed, **When** a reviewer inspects them,
   **Then** they contain only public-safe target data and record generation
   command/version.
2. **Given** a screenshot or terminal recording is added, **When** it is
   reviewed, **Then** it contains no private path or secret-looking value and
   points to the reproducible command.

### Edge Cases

- Demo target is the Portolan repository itself and could overfit to current
  internals.
- Demo target is an external OSS repo with license or cloning constraints.
- Generated artifacts include absolute local paths.
- Artifacts are committed once and later become stale.
- A demo hides unknowns and makes Portolan look like a readiness gate.
- Public case study quotes private review artifacts or local-only paths.
- Visual assets or recordings are added without reproducibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The demo MUST use a public-safe target: Portolan self-map,
  checked-in fixture, or explicitly approved public OSS checkout.
- **FR-001a**: The approved public demo target is Apache Bigtop. The demo MUST
  document how the Bigtop source or landscape is obtained and MUST not rely on
  private local paths.
- **FR-002**: Demo commands MUST write only to explicit local output paths and
  preserve read-only target behavior.
- **FR-003**: Demo documentation MUST show the artifact bundle: `summary.json`,
  `map.md`, `evidence-index.jsonl`, `answer-contract.md`, and at least one
  bounded query or slice.
- **FR-004**: Demo documentation MUST explain what is visible, unknown,
  `cannot_verify`, and `not_assessed`.
- **FR-005**: Case-study wording MUST derive from `docs/product-claims.md` and
  may not broaden Bigtop, Cursor, OpenCode, OSS adapter, duplication,
  relationship, runtime, or security claims.
- **FR-006**: Committed demo artifacts MUST include generation command, source
  version, generated timestamp or explicit staleness note, and privacy review
  state.
- **FR-006a**: The approved first artifact policy is runbook plus small redacted
  excerpts, with freshness and privacy review. Full Bigtop outputs MUST NOT be
  committed in the first public showcase slice.
- **FR-007**: Demo artifacts MUST not include credentials, secret values,
  private customer names, private repository paths, or unsupported external
  service URLs.
- **FR-008**: Screenshots or terminal recordings are optional; if added, they
  MUST be generated from the same public-safe demo and reviewed for private
  context leakage.
- **FR-008a**: Screenshots and terminal recordings are out of scope for the
  first public showcase slice unless separately approved.
- **FR-009**: The README MUST link the public demo route without turning it into
  a landing page or hiding the product boundary.

### Key Entities

- **Demo Target**: The public-safe repository, fixture, or selection used for
  demo artifact generation.
- **Demo Run**: Command, output path, Portolan version, source revision, and
  generated artifact set.
- **Showcase Artifact**: README snippet, `docs/demo.md`, sample output,
  screenshot, terminal recording, or case-study page.
- **Privacy Review**: Inspection record for private paths, credentials, secrets,
  customer names, and unsupported freshness claims.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A fresh checkout user can run the demo in under five minutes using
  only public docs.
- **SC-002**: A reviewer can identify the generated artifact bundle and the
  recommended first artifact to read in under one minute.
- **SC-003**: Case-study copy contains no positive claim outside
  `docs/product-claims.md`.
- **SC-004**: Demo artifacts pass a private-path/secret scan or record a
  blocker before publication.
- **SC-005**: README links the demo route from the first screen without
  replacing the docs onboarding route.

## Assumptions

- The first demo should be docs/artifact based, not a full website.
- The public demo target is Apache Bigtop.
- Visual assets are useful but optional; reproducible text artifacts and
  redacted excerpts come first.
- Full generated Bigtop outputs are likely too large and stale-prone for the
  first public commit; they are out of scope for the first showcase slice.
- Screenshots and terminal recordings are deferred until the text runbook and
  excerpts are verified.
