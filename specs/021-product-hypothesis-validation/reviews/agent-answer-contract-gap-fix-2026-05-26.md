# Hypothesis Ledger: Agent Answer Contract Gap Fix

## Trigger

The user challenged the product logic: Cursor can already read repositories, so
Portolan must augment agents with a concrete workflow for answering CTO
questions, not with another standalone report or hidden selection file.

## Gap Addressed

`specs/027-agent-answer-contract/` adds `answer-contract.md` to context packs.
The artifact tells Cursor and other agents how to use Portolan context, map
artifacts, OSS outputs, and gap records when answering questions about:

- local scope and completeness;
- duplicate components;
- implicit knowledge;
- service relationships;
- configuration surfaces;
- technical-debt candidates.

## Evidence Boundary

- Status: `verified` for artifact generation and documentation alignment after
  local checks in the implementation slice.
- Remaining unknown: semantic architecture coverage, runtime topology, and
  near-clone/component duplication still require map evidence or local OSS
  producers and remain `not_assessed` when those inputs are absent.
- Product implication: this narrows the "Cursor does not know what to do with
  Portolan files" gap. It does not prove full CTO usefulness on arbitrary
  inherited estates without further blind runs.
