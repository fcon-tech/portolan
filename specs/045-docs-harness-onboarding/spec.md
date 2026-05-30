# Feature Specification: Docs And Harness Onboarding

**Feature Branch**: `codex/045-docs-harness-onboarding`

**Created**: 2026-05-29

**Status**: Implemented locally; PR review and GitHub checks not_assessed

**Input**: User description: "Analyze what is currently high quality in human documentation, agent documentation, install/build simplicity, Cursor support, and OpenCode support. Formulate a GitHub Spec Kit improvement specification and start improving it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose The Right Starting Point (Priority: P1)

An engineering leader or agent operator can open one documentation entrypoint and decide which Portolan document to read next for a human overview, an agent run, an install run, a release check, Cursor, or OpenCode.

**Why this priority**: Existing documentation is broad and evidence-disciplined, but the first-hop route is scattered across README, agent docs, product claims, and acceptance matrix pages.

**Independent Test**: A reviewer can start from the top-level documentation and identify the correct next document for human, agent, install, Cursor, and OpenCode workflows without reading the full backlog or spec reviews.

**Acceptance Scenarios**:

1. **Given** a human evaluator starts at the main README, **When** they need the safe product claim, install path, or harness-specific guidance, **Then** the README points them to the maintained route without expanding product claims.
2. **Given** an agent operator starts with a local target and a preferred harness, **When** they choose Cursor or OpenCode, **Then** the route states the verified surface and the unverified surface before execution.

---

### User Story 2 - Run Installation Without Guessing (Priority: P2)

An agent can install or resolve Portolan from a source checkout or binary, pick a harness-compatible output directory, and preserve failed, blocked, unknown, cannot_verify, and not_assessed states.

**Why this priority**: Source bootstrap is already good, but OpenCode default-permission behavior depends on whether the output path is inside the Portolan checkout.

**Independent Test**: A reviewer can use the agent install docs and copyable prompt to select the source bootstrap path, installed binary path, or repo-local OpenCode output fallback without needing acceptance-matrix archaeology.

**Acceptance Scenarios**:

1. **Given** an agent uses OpenCode without permission bypass, **When** it chooses an output directory, **Then** docs recommend a repo-local `.portolan/runs/...` path and keep arbitrary external output behavior failed or not_assessed.
2. **Given** an agent receives a Portolan source checkout, **When** it resolves the command, **Then** docs prefer `scripts/bootstrap-portolan`, preserve default no-network bootstrap behavior, and treat `go run` as development fallback.

---

### User Story 3 - Keep Cursor And OpenCode Claims Honest (Priority: P3)

A maintainer can update docs without accidentally claiming UI Cursor, arbitrary OpenCode targets, or broad harness compatibility beyond recorded evidence.

**Why this priority**: The current product claim boundary is narrow and valuable; onboarding improvements must make that boundary easier to preserve, not broaden it.

**Independent Test**: A reviewer can compare the onboarding docs with product claims and acceptance matrix language and confirm that verified, failed, and not_assessed harness surfaces are not collapsed into success.

**Acceptance Scenarios**:

1. **Given** a maintainer edits Cursor docs, **When** they describe current support, **Then** they name headless Cursor Agent CLI / Composer evidence and keep UI Cursor outside the required acceptance scope.
2. **Given** a maintainer edits OpenCode docs, **When** they describe current support, **Then** they state the verified K2P6 lanes and the failed external default-permission output lane without turning it into a generic failure or success.

### Edge Cases

- A receiving harness rejects writes to an external output directory after bootstrap succeeds.
- A user has a source checkout but Go modules are not cached and network fetching was not approved.
- A target has no `selection.json`, has an invalid `selection.json`, or is too large for immediate full graph loading.
- A user asks for Cursor UI behavior even though only headless Cursor Agent CLI evidence is currently accepted.
- A user asks for OpenCode behavior on arbitrary external targets or output paths beyond the recorded lanes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Documentation MUST provide a single maintained onboarding route for human users, agent operators, and maintainers.
- **FR-002**: The route MUST distinguish human overview, safe product claims, agent quickstart, install prompt, acceptance matrix, release checks, Cursor guidance, and OpenCode guidance.
- **FR-003**: Agent-facing install documentation MUST preserve the installed-binary path, source-checkout bootstrap path, default no-network module-fetching behavior, and development-only `go run` fallback.
- **FR-004**: OpenCode guidance MUST explain that default-permission execution is verified with repo-local output under the Portolan checkout and failed for the recorded external output lane.
- **FR-005**: Cursor guidance MUST explain that current verified evidence is for headless Cursor Agent CLI / Composer lanes, while Cursor UI behavior remains outside the current required acceptance scope.
- **FR-006**: Documentation MUST link harness claims back to `docs/product-claims.md` and acceptance evidence rather than broadening claims in onboarding copy.
- **FR-007**: Documentation MUST preserve local-first, read-only, no-credentials, no-daemon, and explicit-output-directory boundaries.
- **FR-008**: The main README and agent quickstart MUST make the onboarding route discoverable without requiring users to inspect SpecKit review artifacts.
- **FR-009**: The backlog and SpecKit artifacts MUST record the docs-improvement slice and its verification state.

### Key Entities

- **Documentation Route**: A maintained index from user intent to the correct Portolan document or prompt.
- **Harness Surface**: Cursor, OpenCode, or generic shell-capable agent behavior with verified, failed, or not_assessed boundaries.
- **Install Path**: Installed binary, source checkout bootstrap, or development fallback.
- **Evidence State**: Existing Portolan labels such as verified, failed, blocked, unknown, cannot_verify, and not_assessed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can identify the correct first document for human overview, agent run, install, Cursor, and OpenCode workflows from README links in under two minutes.
- **SC-002**: A reviewer can find OpenCode default-permission output guidance without opening any `specs/*/reviews/` file.
- **SC-003**: A reviewer can find Cursor UI scope limits without opening any `specs/*/reviews/` file.
- **SC-004**: Documentation changes pass markdown whitespace checks through `git diff --check`.
- **SC-005**: The spec, plan, tasks, backlog row, and implemented docs agree on the feature scope and completion state.

## Assumptions

- The first improvement should be docs-only; no CLI behavior, schema, or packaging changes are required.
- English remains the primary repository documentation language, with the existing Russian overview updated only enough to point to the new route.
- No new dependency, tool, service, network behavior, or harness-specific runtime integration is needed for this slice.
- Current product claims and acceptance-matrix evidence are authoritative for Cursor and OpenCode wording.
