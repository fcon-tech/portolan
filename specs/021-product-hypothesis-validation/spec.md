# Feature Specification: Product Hypothesis Validation

**Feature Branch**: `021-product-hypothesis-validation`

**Created**: 2026-05-26

**Status**: Implemented for initial and blind Cursor hypothesis ledgers; deeper OSS adapters pending

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
