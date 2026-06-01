# Feature Specification: Product Hypothesis Validation

**Feature Branch**: `021-product-hypothesis-validation`

**Created**: 2026-05-26

**Status**: Implemented for the current H1-H10 hypothesis cycle; UI
Cursor/Composer, semantic code search, and live/runtime topology remain
`not_assessed`

**Input**: Product correction: Portolan's market fit must be tested as agent
augmentation, not as a standalone report tool or prepared-landscape demo.

## Requirements

- **FR-001**: Hypotheses MUST be phrased as falsifiable claims about agent
  behavior and CTO answers.
- **FR-002**: Each hypothesis MUST name the target user, target question,
  required evidence, acceptance client, and failure condition.
- **FR-003**: Prepared selections MUST NOT count as proof for blind first-run
  usefulness.
- **FR-004**: Product validation MUST compare Cursor-alone with
  Cursor-plus-Portolan context preparation.
- **FR-005**: Results MUST preserve `not_assessed`, `unknown`, and
  `cannot_verify`.

## Initial Hypotheses

- H1: Cursor-plus-Portolan context preparation reduces false repository-scope
  claims compared with Cursor alone on a multi-repo folder.
- H2: Cursor-plus-Portolan can answer "where are duplicated components likely?"
  better when local jscpd/SBOM outputs are present.
- H3: Cursor-plus-Portolan can describe service/API relationships more honestly
  when Backstage/OpenAPI/AsyncAPI/Structurizr files are indexed.
- H4: The value proposition fails if the agent brief is ignored or if the pack
  is just another large dump.
- H5: Cursor Agent can use Portolan as an augmentation layer from only Portolan
  path, target root, output directory, and local/no-mutation boundaries.
- H6: After `answer-contract.md`, headless Cursor Agent can answer a real
  multi-repo CTO question from Portolan summary/context artifacts without
  loading the full raw graph.
- H7: After `graph-index.json`, headless Cursor Agent can identify first graph
  drill-down entrypoints for a real multi-repo landscape without loading the
  full raw graph.
- H8: After `portolan graph slice`, agents can perform a second bounded
  drill-down from a real map bundle without putting full `graph.json` in the
  prompt.
- H9: A new OSS/tool-output family is not considered part of the Portolan
  assembly until its adapter contract validates locally.
- H10: A bounded `evidence-index.jsonl` makes Cursor-plus-Portolan more usable
  for CTO questions by giving agents one first-pass list of local evidence
  records and gaps before deeper drill-down.
