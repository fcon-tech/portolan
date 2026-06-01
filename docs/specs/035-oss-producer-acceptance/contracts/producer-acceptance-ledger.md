# Producer Acceptance Ledger Contract

A producer acceptance ledger must include:

1. Target and command preconditions.
2. Producer availability and safety decisions.
3. Execution result for each producer family.
4. Output disposition and bounded summary.
5. Evidence impact on stakeholder answers.
6. Product claim decision and remaining gaps.

Allowed producer statuses:

- `verified`: producer ran locally and output was summarized.
- `blocked`: producer could not run due to unavailable binary, safety boundary,
  missing approval, or explicit local constraint.
- `failed`: producer ran and returned an execution or parse failure.
- `unsafe`: producer was rejected due to privacy, license, network, mutation, or
  credential risk.
- `not_assessed`: producer was not applicable or not checked.

The ledger must not count `blocked`, `unsafe`, `failed`, or `not_assessed` as
verified OSS composition value.
