# Implementation Plan: Product Hypothesis Validation

## Decision Gate

- Simpler/Faster: define a small evaluation ledger and run two local targets
  before building a larger harness.
- Blocking Edge Cases: agent nondeterminism, unavailable Cursor runs, stale
  local targets, and private data in transcripts.
- Existing Open Source: use existing agent/harness outputs and local run
  ledgers; no evaluation framework dependency is needed yet.

## Verification

Validation evidence must be stored under the relevant spec `reviews/`
directory, with private target details redacted when needed.

