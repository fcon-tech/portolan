# Pre-Implementation Review Disposition: Selection And Inventory Input

Date: 2026-05-20

## Review Runs

- Local repo-grounded requirements/contract review: assessed.
- `pi` lane `kimi-coding/kimi-for-coding`: `not_assessed`; output attempted to
  explore the repository with shell text instead of returning findings.
- `pi` lane `minimax/MiniMax-M2.7`: `not_assessed`; output contained tool-call
  style text and no usable grounded findings.
- `pi` lane `zai/glm-5.1`: `not_assessed`; output started generic exploration
  and did not return findings against the provided review packet.

## Accepted And Fixed

### Major: Metadata Was Modeled As A Graph Target Kind

Disposition: accepted and fixed before implementation.

Why it mattered:

- `schema/evidence-graph.schema.json` does not allow a `metadata` node kind.
- The existing scan path turns every `targets[]` entry into a graph node.
- Accepting `metadata` as `targets[].kind` would let a valid selection produce a
  schema-invalid evidence graph.

Fix:

- `metadata[]` and `runtime[]` are now modeled as selected input collections,
  not graph target kinds.
- `targets[].kind` remains aligned with graph node kinds.
- Tasks now require validation without treating metadata as a graph node kind.

## Ready For Implementation

P0-002 is ready for implementation after this review because:

- `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`,
  `quickstart.md`, and `tasks.md` are present.
- The accepted blocker was fixed in the spec/task contract before coding.
- Required verification commands are named in `tasks.md`.

## Not Assessed

- Runtime implementation behavior is `not_assessed`; no behavior changes have
  been made yet.
- External model review coverage is `not_assessed` because the attempted lanes
  did not return usable review findings.
