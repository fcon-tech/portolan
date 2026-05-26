# Feature Specification: Agent Answer Contract

**Feature Branch**: `027-agent-answer-contract`

**Created**: 2026-05-26

**Status**: Implemented

**Input**: Cursor/agent runs showed that agents can read Portolan context files
but still need an explicit answer contract for CTO-level questions about large,
multi-repo landscapes. Without it, agents may treat `agent-brief.md`,
`query-plan.md`, `tool-registry.json`, `oss-plan.json`, `gaps.jsonl`, and map
artifacts as unrelated hints instead of one evidence protocol.

## Requirements

- **FR-001**: `portolan context prepare` MUST emit an `answer-contract.md`
  artifact in the context pack.
- **FR-002**: The contract MUST tell agents how to answer CTO questions about
  local scope, duplicate components, implicit knowledge, service relationships,
  configuration surfaces, and technical debt.
- **FR-003**: The contract MUST map each question family to existing Portolan
  artifacts and optional local OSS evidence, rather than creating a second
  source of truth.
- **FR-004**: The contract MUST preserve `unknown`, `cannot_verify`, and
  `not_assessed`; missing evidence MUST be reported explicitly instead of
  converted into architecture conclusions.
- **FR-005**: The contract MUST explain how `context prepare` and `map` relate:
  context pack first for scope and available evidence, map bundle when a graph,
  findings, duplication, configuration, relationship, or technical-debt answer
  is needed.
- **FR-006**: Agent docs, Cursor rules, and CLI help MUST list
  `answer-contract.md` as a required broad-answer artifact.
- **FR-007**: The product hypothesis ledger MUST record that the slice addresses
  the "Cursor can see files but does not know how to use them" gap, not the
  deeper gap of proving semantic architecture coverage.

## Success Criteria

- **SC-001**: `portolan context prepare --root <dir> --out <dir> --profile
  cursor` writes `answer-contract.md`.
- **SC-002**: The answer contract names `findings.jsonl`, `graph.json`,
  `coverage.json`, `summary.json`, `tool-registry.json`, `oss-plan.json`, and
  `gaps.jsonl` as evidence surfaces.
- **SC-003**: The answer contract contains explicit rules for duplication,
  implicit knowledge, relationships, configuration, technical debt, and missing
  evidence states.
- **SC-004**: CLI help and agent-facing docs list the artifact.
