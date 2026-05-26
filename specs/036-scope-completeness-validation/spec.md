# Feature Specification: Scope Completeness Validation

**Feature Branch**: `036-scope-completeness-validation`

**Created**: 2026-05-26

**Status**: Draft

**Input**: User description: "Portolan cannot claim it understands an inherited
estate if local repository scope and ecosystem completeness are unknown."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distinguish Local Scope From Complete Estate (Priority: P1)

A CTO or evaluator can see the difference between repositories visible on disk,
directories that look relevant but are not confirmed repositories, and the
larger estate that may be missing from the local target.

**Why this priority**: A product claim about understanding a codebase collapses
if the system cannot say what is and is not in scope.

**Independent Test**: Run validation against a local target with known
repositories, non-repository directories, and optional local inventory; verify
that local scope and completeness are reported separately.

**Acceptance Scenarios**:

1. **Given** a local target without a complete inventory, **When** scope is
   reported, **Then** local repositories are listed as visible and ecosystem
   completeness remains `unknown`.
2. **Given** a local inventory exists, **When** scope is validated, **Then** the
   report distinguishes represented, missing, extra, and unverifiable entries.
3. **Given** directories look relevant but lack repository boundaries, **When**
   scope is reported, **Then** they are not silently counted as source-visible
   repositories.

### Edge Cases

- The target contains nested repositories, worktrees, generated directories, or
  archived copies.
- The inventory references repositories absent from disk.
- The local target includes non-source operational repositories.
- The inventory itself is stale or incomplete.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The validation MUST report local visible repositories separately
  from ecosystem completeness.
- **FR-002**: The validation MUST support a user-supplied local inventory as
  evidence for expected scope.
- **FR-003**: The validation MUST classify each expected or discovered item as
  represented, missing, extra, unknown, or cannot_verify.
- **FR-004**: The validation MUST not mark ecosystem completeness as verified
  without local inventory evidence.
- **FR-005**: The validation MUST record non-repository but relevant-looking
  directories as weak or unknown evidence, not as confirmed repositories.
- **FR-006**: The validation MUST update product claims so "local scope" and
  "complete inherited estate" are never used interchangeably.

### Key Entities

- **Visible Repository**: A repository confirmed in the local target.
- **Expected Inventory Item**: A repository or system listed by user-provided
  local inventory.
- **Scope Gap**: A missing, extra, unknown, or unverifiable item.
- **Completeness Decision**: Whether the local target can be treated as the
  complete estate for the validation run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of discovered repositories are classified as visible,
  duplicate, ignored, or cannot_verify.
- **SC-002**: If inventory is provided, 100% of expected items are classified as
  represented, missing, extra, or cannot_verify.
- **SC-003**: If no inventory is provided, the validation report explicitly
  marks ecosystem completeness as `unknown`.
- **SC-004**: No product claim uses local repository count as proof of complete
  estate coverage unless the completeness decision is verified.

## Assumptions

- Local inventory may be manually supplied for validation.
- Completeness is not inferred from directory count or repository count alone.
- Non-source repositories can be valid evidence surfaces but must be labeled as
  such.
