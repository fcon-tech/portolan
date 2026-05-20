# Initial Review Disposition: Local Evidence Graph MVP

Date: 2026-05-20

## Review Runs

- `codex-subagent` / `pi` panel: attempted with requirements, UX, code,
  evidence, and security roles; marked `not_assessed` because the generated
  `pi` invocation placed runtime flags in the prompt argument and produced no
  usable reviewer output before cancellation.
- Codex requirements/readiness lane: assessed.
- Codex security/evidence lane: assessed.

## Accepted Findings

### Major: Symlink Escape Boundary Was Not Forced By Tasks

Disposition: accepted and fixed in spec/task contract.

Evidence:

- `spec.md` now states that symlinks resolving outside the selected root are
  recorded as `cannot_verify` and not followed for evidence discovery.
- `data-model.md` now requires canonical filesystem path handling.
- `tasks.md` now requires failing tests for `../` lexical variants and
  repository symlinks resolving outside the selected root.

### Major: Output Write Safety Was Underspecified

Disposition: accepted and fixed in spec/task contract.

Decision:

- Existing output paths fail unless `--force` is provided.
- Output directories, output symlinks, missing output parents, and output paths
  inside selected repository roots are invalid.

Rejected alternative:

- Deterministic alternate output filenames were rejected for this slice because
  they make CLI behavior less explicit and add more write-path surface.

### Minor: `jq` Parse Checks Were Overstated As Schema Validation

Disposition: accepted and fixed in success criteria.

Decision:

- This slice keeps standard-library implementation and fixture-level schema
  contract assertions.
- Full JSON Schema runtime validation is deferred until a dependency is
  justified by later schema or importer work.

## Still Open For Implementation

- Current `scan` command is a bootstrap stub and does not satisfy P0-001.
- Fixture coverage for `source-visible`, `claim-only`, `unknown`, and
  `cannot_verify` is not implemented yet.
- Network absence, target repository non-mutation, determinism, and generated
  graph parsing are not assessed until implementation exists.
